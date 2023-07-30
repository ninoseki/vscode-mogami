import * as vscode from "vscode";

export interface ExtensionComponent {
  activate(context?: vscode.ExtensionContext): unknown;
}
