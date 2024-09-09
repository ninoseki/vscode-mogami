import * as vscode from "vscode";

import { CodeLensProvider } from "@/codeLens/codeLensProvider";
import { CodeLensState } from "@/codeLens/codeLensState";

export class OnActiveTextEditorChange {
  disposable: vscode.Disposable;
  codeLensProviders: CodeLensProvider[];
  state: CodeLensState;

  constructor(codeLensProviders: CodeLensProvider[], state: CodeLensState) {
    this.codeLensProviders = codeLensProviders;
    this.state = state;
    // register the vscode workspace event
    this.disposable = vscode.window.onDidChangeActiveTextEditor(
      this.execute,
      this,
    );
  }

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
