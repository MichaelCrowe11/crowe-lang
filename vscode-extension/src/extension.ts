import * as path from 'path';
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
  // The server is implemented in the crowe-language-server package
  const serverModule = context.asAbsolutePath(
    path.join('..', '..', 'packages', 'crowe-language-server', 'src', 'server.js')
  );
  
  // The debug options for the server
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions
    }
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for Crowe documents
    documentSelector: [{ scheme: 'file', language: 'crowe' }],
    synchronize: {
      // Notify the server about file changes to '.crowe' files contained in the workspace
      fileEvents: vscode.workspace.createFileSystemWatcher('**/.crowe')
    }
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    'croweLanguageServer',
    'Crowe Language Server',
    serverOptions,
    clientOptions
  );

  // Start the client. This will also launch the server
  client.start();

  // Register commands
  const compileCommand = vscode.commands.registerCommand('crowe.compileFile', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    if (editor.document.languageId !== 'crowe') {
      vscode.window.showErrorMessage('Current file is not a Crowe file');
      return;
    }

    const filePath = editor.document.fileName;
    const outputPath = filePath.replace(/\.crowe$/, '.tsx');

    try {
      const terminal = vscode.window.createTerminal('Crowe Compiler');
      terminal.sendText(`crowe compile "${filePath}" -o "${outputPath}"`);
      terminal.show();
      
      vscode.window.showInformationMessage(`Compiling ${path.basename(filePath)}...`);
    } catch (error) {
      vscode.window.showErrorMessage(`Compilation failed: ${error}`);
    }
  });

  const compileWatchCommand = vscode.commands.registerCommand('crowe.compileWatch', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    if (editor.document.languageId !== 'crowe') {
      vscode.window.showErrorMessage('Current file is not a Crowe file');
      return;
    }

    const filePath = editor.document.fileName;
    const outputPath = filePath.replace(/\.crowe$/, '.tsx');

    try {
      const terminal = vscode.window.createTerminal('Crowe Watch');
      terminal.sendText(`crowe compile "${filePath}" -o "${outputPath}" --watch`);
      terminal.show();
      
      vscode.window.showInformationMessage(`Watching ${path.basename(filePath)} for changes...`);
    } catch (error) {
      vscode.window.showErrorMessage(`Watch mode failed: ${error}`);
    }
  });

  const showOutputCommand = vscode.commands.registerCommand('crowe.showOutput', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }

    if (editor.document.languageId !== 'crowe') {
      vscode.window.showErrorMessage('Current file is not a Crowe file');
      return;
    }

    const filePath = editor.document.fileName;
    const outputPath = filePath.replace(/\.crowe$/, '.tsx');

    try {
      const document = await vscode.workspace.openTextDocument(outputPath);
      await vscode.window.showTextDocument(document, { viewColumn: vscode.ViewColumn.Beside });
    } catch (error) {
      vscode.window.showErrorMessage(`Could not open output file: ${error}`);
    }
  });

  context.subscriptions.push(compileCommand, compileWatchCommand, showOutputCommand);

  // Auto-compile on save
  const autoCompileOnSave = vscode.workspace.onDidSaveTextDocument(async (document) => {
    if (document.languageId === 'crowe') {
      const config = vscode.workspace.getConfiguration('crowe');
      const autoCompile = config.get<boolean>('autoCompileOnSave', false);
      
      if (autoCompile) {
        const filePath = document.fileName;
        const outputPath = filePath.replace(/\.crowe$/, '.tsx');
        
        const terminal = vscode.window.createTerminal('Crowe Auto-Compile');
        terminal.sendText(`crowe compile "${filePath}" -o "${outputPath}"`);
        terminal.dispose(); // Auto-dispose after command
        
        vscode.window.showInformationMessage(
          `Auto-compiled ${path.basename(filePath)}`,
          'Show Output'
        ).then((action) => {
          if (action === 'Show Output') {
            vscode.commands.executeCommand('crowe.showOutput');
          }
        });
      }
    }
  });

  context.subscriptions.push(autoCompileOnSave);
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}