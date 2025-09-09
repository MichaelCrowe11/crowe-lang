"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
const node_1 = require("vscode-languageclient/node");
let client;
function activate(context) {
    // The server is implemented in the crowe-language-server package
    const serverModule = context.asAbsolutePath(path.join('..', '..', 'packages', 'crowe-language-server', 'src', 'server.js'));
    // The debug options for the server
    const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions = {
        run: { module: serverModule, transport: node_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            transport: node_1.TransportKind.ipc,
            options: debugOptions
        }
    };
    // Options to control the language client
    const clientOptions = {
        // Register the server for Crowe documents
        documentSelector: [{ scheme: 'file', language: 'crowe' }],
        synchronize: {
            // Notify the server about file changes to '.crowe' files contained in the workspace
            fileEvents: vscode.workspace.createFileSystemWatcher('**/.crowe')
        }
    };
    // Create the language client and start the client.
    client = new node_1.LanguageClient('croweLanguageServer', 'Crowe Language Server', serverOptions, clientOptions);
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
        }
        catch (error) {
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
        }
        catch (error) {
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
        }
        catch (error) {
            vscode.window.showErrorMessage(`Could not open output file: ${error}`);
        }
    });
    context.subscriptions.push(compileCommand, compileWatchCommand, showOutputCommand);
    // Auto-compile on save
    const autoCompileOnSave = vscode.workspace.onDidSaveTextDocument(async (document) => {
        if (document.languageId === 'crowe') {
            const config = vscode.workspace.getConfiguration('crowe');
            const autoCompile = config.get('autoCompileOnSave', false);
            if (autoCompile) {
                const filePath = document.fileName;
                const outputPath = filePath.replace(/\.crowe$/, '.tsx');
                const terminal = vscode.window.createTerminal('Crowe Auto-Compile');
                terminal.sendText(`crowe compile "${filePath}" -o "${outputPath}"`);
                terminal.dispose(); // Auto-dispose after command
                vscode.window.showInformationMessage(`Auto-compiled ${path.basename(filePath)}`, 'Show Output').then((action) => {
                    if (action === 'Show Output') {
                        vscode.commands.executeCommand('crowe.showOutput');
                    }
                });
            }
        }
    });
    context.subscriptions.push(autoCompileOnSave);
}
exports.activate = activate;
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map