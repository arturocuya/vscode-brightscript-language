import * as vscode from 'vscode';
import { SceneGraphCommandResponse, SceneGraphDebugCommandController } from 'roku-debug';

export class SceneGraphDebugCommands {

    constructor() {
    }

    private outputChannel: vscode.OutputChannel;
    private context: vscode.ExtensionContext;
    private host: string;

    public registerCommands(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        this.context = context;
        this.outputChannel = outputChannel;

        let subscriptions = context.subscriptions;

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.bsprofPause', async () => {
            await this.logCommandOutput(async (commandController) => commandController.bsprof('pause'));
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.bsprofResume', async () => {
            await this.logCommandOutput(async (commandController) => commandController.bsprof('resume'));
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.bsprofStatus', async () => {
            await this.logCommandOutput(async (commandController) => commandController.bsprof('status'));
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.chanperf', async () => {
            await this.logCommandOutput(async (commandController) => commandController.chanperf());
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.chanperfChangeInterval', async () => {
            let interval = parseInt(await vscode.window.showInputBox({ placeHolder: 'seconds' }));
            if (!isNaN(interval)) {
                await this.logCommandOutput(async (commandController) => commandController.chanperf({ interval: interval }));
            }
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.clearLaunchCaches', async () => {
            await this.logCommandOutput(async (commandController) => commandController.clearLaunchCaches());
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.fpsDisplay', async () => {
            let option = await vscode.window.showQuickPick(['toggle', 'on', 'off'], { placeHolder: 'Please select an option' });
            if (option) {
                await this.logCommandOutput(async (commandController) => commandController.fpsDisplay(option as 'toggle' | 'on' | 'off'));
            }
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.free', async () => {
            await this.logCommandOutput(async (commandController) => commandController.free());
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.genKey', async () => {
            await this.logCommandOutput(async (commandController) => commandController.genkey());
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.loadedTextures', async () => {
            await this.logCommandOutput(async (commandController) => commandController.loadedTextures());
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.logrendezvous', async () => {
            let option = await vscode.window.showQuickPick(['status', 'on', 'off'], { placeHolder: 'Please select an option' });
            if (option) {
                await this.logCommandOutput(async (commandController) => commandController.logrendezvous(option as 'status' | 'on' | 'off'));
            }
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.plugins', async () => {
            await this.logCommandOutput(async (commandController) => commandController.plugins());
        }));

        // TODO: press? likely needs to go in the old area.
        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.press', async () => {
            let keys = await (await vscode.window.showInputBox({ placeHolder: 'comma separated list of keys' })).split(',');
            if (keys.length > 1) {
                await this.logCommandOutput(async (commandController) => commandController.press(keys));
            }
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.r2d2bitmaps', async () => {
            await this.logCommandOutput(async (commandController) => commandController.r2d2Bitmaps());
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.removePlugin', async () => {
            let pluginId = await vscode.window.showInputBox({ placeHolder: 'plugin_id' });

            if (pluginId) {
                await this.logCommandOutput(async (commandController) => commandController.removePlugin(pluginId));
            }
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.sgnodesAll', async () => {
            await this.logCommandOutput(async (commandController) => commandController.sgnodes('all'));
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.sgnodesRoots', async () => {
            await this.logCommandOutput(async (commandController) => commandController.sgnodes('roots'));
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.sgnodesNodeId', async () => {
            let nodeId = await vscode.window.showInputBox({ placeHolder: 'node_id' });
            if (nodeId) {
                await this.logCommandOutput(async (commandController) => commandController.sgnodes(nodeId));
            }
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.sgperfStart', async () => {
            await this.logCommandOutput(async (commandController) => commandController.sgperf('start'));
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.sgperfStop', async () => {
            await this.logCommandOutput(async (commandController) => commandController.sgperf('stop'));
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.sgperfClear', async () => {
            await this.logCommandOutput(async (commandController) => commandController.sgperf('clear'));
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.sgperfReport', async () => {
            await this.logCommandOutput(async (commandController) => commandController.sgperf('report'));
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.showKey', async () => {
            await this.logCommandOutput(async (commandController) => commandController.showkey());
        }));

        subscriptions.push(vscode.commands.registerCommand('extension.brightscript.custom8080Command', async () => {
            let command = await vscode.window.showInputBox({ placeHolder: 'custom command' });
            if (command) {
                await this.logCommandOutput(async (commandController) => commandController.exec(command));
            }
        }));
    }

    private async logCommandOutput(callback: (controller: SceneGraphDebugCommandController) => Promise<SceneGraphCommandResponse>) {
        await this.getRemoteHost();
        let response = await callback(new SceneGraphDebugCommandController(this.host));
        this.outputChannel.appendLine(`>${response.command}\n${response?.error ? response?.error.message : response.result.rawResponse}`);
        this.outputChannel.show();
    }

    public async getRemoteHost() {
        this.host = await this.context.workspaceState.get('remoteHost');
        if (!this.host) {
            let config = await vscode.workspace.getConfiguration('brightscript.remoteControl', null);
            this.host = config.get('host');
            if (this.host === '${promptForHost}') {
                this.host = await vscode.window.showInputBox({
                    placeHolder: 'The IP address of your Roku device',
                    value: ''
                });
            }
        }
        if (!this.host) {
            throw new Error('Can\'t send command: host is required.');
        } else {
            await this.context.workspaceState.update('remoteHost', this.host);
        }
    }

}

export const sceneGraphDebugCommands = new SceneGraphDebugCommands();
