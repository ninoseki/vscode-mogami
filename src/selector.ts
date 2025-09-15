import * as vscode from "vscode";

export class Selector {
  constructor(
    public readonly documentSelector: vscode.DocumentSelector,
    public readonly documentPattern?: RegExp,
  ) {}

  public hasPattern(document: vscode.TextDocument): boolean {
    if (!this.documentPattern) {
      return true;
    }
    return this.documentPattern.test(document.getText());
  }
}
