import * as vscode from "vscode";

import { ExtensionComponent } from "@/extensionComponent";

export abstract class AbstractCodeLensProvider
  implements vscode.CodeLensProvider, ExtensionComponent
{
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor(private documentSelector: vscode.DocumentSelector) {
    this.documentSelector = documentSelector;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  abstract provideCodeLenses(
    document: vscode.TextDocument,
  ): vscode.ProviderResult<vscode.CodeLens[]>;

  public activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(this.documentSelector, this),
    );
  }
}
