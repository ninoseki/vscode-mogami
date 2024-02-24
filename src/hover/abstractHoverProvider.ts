import * as vscode from "vscode";

import { ExtensionComponent } from "@/extensionComponent";

export abstract class AbstractHoverProvider
  implements vscode.HoverProvider, ExtensionComponent
{
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor(private documentSelector: vscode.DocumentSelector) {
    this.documentSelector = documentSelector;

    vscode.workspace.onDidChangeConfiguration(() => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  abstract provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.Hover | undefined>;

  public activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider(this.documentSelector, this),
    );
  }
}
