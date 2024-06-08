import * as vscode from "vscode";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { CodeLensState } from "../codeLensState";

export class OnActiveTextEditorChange {
  disposable: vscode.Disposable;
  codeLensProviders: AbstractCodeLensProvider[];
  state: CodeLensState;

  constructor(
    codeLensProviders: AbstractCodeLensProvider[],
    state: CodeLensState,
  ) {
    this.codeLensProviders = codeLensProviders;
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
    if (!textEditor || textEditor.document.uri.scheme !== "file") {
      await this.state.providerActive.change(undefined);
      return;
    }

    this.codeLensProviders.forEach((provider) => {
      provider.reloadCodeLenses();
    });
  }

  dispose() {
    this.disposable.dispose();
  }
}
