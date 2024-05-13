import * as vscode from "vscode";

import { CodeLensState } from "../codeLensState";

export class OnActiveTextEditorChange {
  disposable: vscode.Disposable;
  state: CodeLensState;

  constructor(state: CodeLensState) {
    this.state = state;
    // register the vscode workspace event
    this.disposable = vscode.window.onDidChangeActiveTextEditor(
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.execute,
      this,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(textEditor?: vscode.TextEditor): Promise<void> {
    await this.state.clearProviderActive();
  }

  dispose() {
    this.disposable.dispose();
  }
}
