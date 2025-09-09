#!/usr/bin/env node
import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  DocumentDiagnosticReportKind,
  type DocumentDiagnosticReport,
  Diagnostic,
  DiagnosticSeverity,
  Range,
  Position,
  Hover,
  MarkupKind
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import { parseCroweWithErrors } from '../../crowe-compiler/src/parser';

// Create a connection for the server
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['.', ' ', '\n']
      },
      hoverProvider: true,
      diagnosticProvider: {
        interFileDependencies: false,
        workspaceDiagnostics: false
      }
    }
  };
  
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true
      }
    };
  }
  
  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(DidChangeConfigurationNotification.type, undefined);
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(_event => {
      connection.console.log('Workspace folder change event received.');
    });
  }
});

// The global settings, used when the `workspace/configuration` request is not supported by the client.
interface CroweSettings {
  enableDiagnostics: boolean;
  enableAutoCompletion: boolean;
}

const defaultSettings: CroweSettings = { 
  enableDiagnostics: true, 
  enableAutoCompletion: true 
};
let globalSettings: CroweSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<CroweSettings>> = new Map();

connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = <CroweSettings>(
      (change.settings.crowe || defaultSettings)
    );
  }
  // Refresh the diagnostics since the `maxNumberOfProblems` could have changed.
  documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<CroweSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: 'crowe'
    });
    documentSettings.set(resource, result);
  }
  return result;
}

// Only keep settings for open documents
documents.onDidClose(e => {
  documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  const settings = await getDocumentSettings(textDocument.uri);
  if (!settings.enableDiagnostics) {
    return;
  }

  const text = textDocument.getText();
  const result = parseCroweWithErrors(text, textDocument.uri);
  
  const diagnostics: Diagnostic[] = [];

  if (result.errors.hasErrors()) {
    for (const error of result.errors.getErrors()) {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: error.line - 1, character: error.column - 1 },
          end: { line: error.line - 1, character: error.column + 10 }
        },
        message: error.message,
        source: 'crowe'
      };
      
      diagnostics.push(diagnostic);
    }
  }

  if (result.errors.getWarnings().length > 0) {
    for (const warning of result.errors.getWarnings()) {
      const diagnostic: Diagnostic = {
        severity: DiagnosticSeverity.Warning,
        range: {
          start: { line: warning.line - 1, character: warning.column - 1 },
          end: { line: warning.line - 1, character: warning.column + 10 }
        },
        message: warning.message,
        source: 'crowe'
      };
      
      diagnostics.push(diagnostic);
    }
  }

  // Send the computed diagnostics to VSCode.
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.languages.onDiagnostic(async (params) => {
  const document = documents.get(params.textDocument.uri);
  if (document !== undefined) {
    return {
      kind: DocumentDiagnosticReportKind.Full,
      items: await getDiagnostics(document)
    } satisfies DocumentDiagnosticReport;
  } else {
    return {
      kind: DocumentDiagnosticReportKind.Full,
      items: []
    } satisfies DocumentDiagnosticReport;
  }
});

async function getDiagnostics(textDocument: TextDocument): Promise<Diagnostic[]> {
  const settings = await getDocumentSettings(textDocument.uri);
  if (!settings.enableDiagnostics) {
    return [];
  }

  const text = textDocument.getText();
  const result = parseCroweWithErrors(text, textDocument.uri);
  
  const diagnostics: Diagnostic[] = [];

  if (result.errors.hasErrors()) {
    for (const error of result.errors.getErrors()) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: error.line - 1, character: error.column - 1 },
          end: { line: error.line - 1, character: error.column + 10 }
        },
        message: error.message,
        source: 'crowe'
      });
    }
  }

  return diagnostics;
}

// This handler provides the initial list of the completion items.
connection.onCompletion((_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
  const completions: CompletionItem[] = [
    // Crowe keywords
    {
      label: 'component',
      kind: CompletionItemKind.Keyword,
      data: 1,
      detail: 'Define a new Crowe component',
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'Creates a new Crowe component with state, computed, actions, and render'
      }
    },
    {
      label: 'store',
      kind: CompletionItemKind.Keyword,
      data: 2,
      detail: 'Define a Crowe store for cross-component state',
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'Creates a Zustand store for managing shared state across components'
      }
    },
    {
      label: 'state',
      kind: CompletionItemKind.Keyword,
      data: 3,
      detail: 'Define reactive state',
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'Declares a reactive state variable that triggers re-renders when changed'
      }
    },
    {
      label: 'computed',
      kind: CompletionItemKind.Keyword,
      data: 4,
      detail: 'Define computed value',
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'Creates a computed value that automatically updates when dependencies change'
      }
    },
    {
      label: 'action',
      kind: CompletionItemKind.Function,
      data: 5,
      detail: 'Define an action function',
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'Creates a function that can modify state and perform side effects'
      }
    },
    {
      label: 'effect',
      kind: CompletionItemKind.Function,
      data: 6,
      detail: 'Define a side effect',
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'Creates a side effect that runs when dependencies change'
      }
    },
    {
      label: 'render',
      kind: CompletionItemKind.Keyword,
      data: 7,
      detail: 'Define component render function',
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'Defines what the component should render (JSX)'
      }
    },
    {
      label: 'stream',
      kind: CompletionItemKind.Variable,
      data: 8,
      detail: 'Define real-time data stream',
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'Creates a WebSocket or EventSource connection for real-time data'
      }
    },
    {
      label: 'ai',
      kind: CompletionItemKind.Variable,
      data: 9,
      detail: 'Define AI model',
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'Loads an AI model for inference operations'
      }
    },
    {
      label: 'onMount',
      kind: CompletionItemKind.Event,
      data: 10,
      detail: 'Component mount effect',
      documentation: {
        kind: MarkupKind.Markdown,
        value: 'Runs once when the component mounts'
      }
    }
  ];

  return completions;
});

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  switch (item.data) {
    case 1:
      item.insertText = 'component ${1:ComponentName}(${2:props}) {\n  render {\n    ${3:<div>Hello</div>}\n  }\n}';
      item.insertTextFormat = 2; // Snippet
      break;
    case 2:
      item.insertText = 'store ${1:StoreName} {\n  state ${2:value}: ${3:string} = ${4:"default"};\n  \n  action ${5:setValue}(${6:newValue}: ${3:string}) {\n    ${2:value} = ${6:newValue};\n  }\n}';
      item.insertTextFormat = 2;
      break;
    case 3:
      item.insertText = 'state ${1:name}: ${2:type} = ${3:defaultValue};';
      item.insertTextFormat = 2;
      break;
    case 4:
      item.insertText = 'computed ${1:name}: ${2:type} {\n  return ${3:expression};\n}';
      item.insertTextFormat = 2;
      break;
    case 5:
      item.insertText = 'action ${1:name}(${2:params}) {\n  ${3:// Action code}\n}';
      item.insertTextFormat = 2;
      break;
    case 6:
      item.insertText = 'effect ${1:name}(deps: [${2:dependencies}]) {\n  ${3:// Effect code}\n}';
      item.insertTextFormat = 2;
      break;
    case 7:
      item.insertText = 'render {\n  ${1:<div>${2:content}</div>}\n}';
      item.insertTextFormat = 2;
      break;
    case 8:
      item.insertText = 'stream ${1:name}: ${2:type} = ${3:"wss://example.com"};';
      item.insertTextFormat = 2;
      break;
    case 9:
      item.insertText = 'ai ${1:name}: ${2:type} = model("${3:model-name}");';
      item.insertTextFormat = 2;
      break;
  }
  return item;
});

// Hover provider
connection.onHover((params: TextDocumentPositionParams): Hover | null => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const text = document.getText();
  const offset = document.offsetAt(params.position);
  
  // Simple word extraction around cursor
  let start = offset;
  let end = offset;
  
  while (start > 0 && /[a-zA-Z0-9_]/.test(text[start - 1])) {
    start--;
  }
  
  while (end < text.length && /[a-zA-Z0-9_]/.test(text[end])) {
    end++;
  }
  
  const word = text.slice(start, end);
  
  const hoverInfo: Record<string, string> = {
    'component': 'A Crowe component - compiles to React function component with hooks',
    'store': 'A Crowe store - compiles to Zustand store for shared state management',
    'state': 'Reactive state variable - compiles to useState hook',
    'computed': 'Computed value - compiles to useMemo or IIFE',
    'action': 'Action function - can modify state and perform side effects',
    'effect': 'Side effect - compiles to useEffect hook',
    'render': 'Component render function - returns JSX',
    'stream': 'Real-time data stream - WebSocket or EventSource',
    'ai': 'AI model declaration - loads model for inference',
    'onMount': 'Effect that runs once when component mounts'
  };

  if (hoverInfo[word]) {
    return {
      contents: {
        kind: MarkupKind.Markdown,
        value: `**${word}**\n\n${hoverInfo[word]}`
      }
    };
  }

  return null;
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();