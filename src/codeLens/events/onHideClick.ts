import * as vscode from "vscode";

import { CodeLensProvider } from "@/codeLens/codeLensProvider";
import { CodeLensState } from "@/codeLens/codeLensState";
import { OnHideClickCommand } from "@/constants";

export class OnHideClick {
  disposable: vscode.Disposable;
  codeLensProviders: CodeLensProvider[];
  state: CodeLensState;

  constructor(codeLensProviders: CodeLensProvider[], state: CodeLensState) {
    this.state = state;
    this.codeLensProviders = codeLensProviders;
    this.disposable = vscode.commands.registerCommand(
      OnHideClickCommand,
      this.execute,
      this,
    );
  }

  async execute() {
    await this.state.disableShow();

    this.codeLensProviders
      .filter((provider) => provider.name === this.state.providerActive.value)
      .forEach((provider) => {
        provider.reloadCodeLenses();
      });
  }

  async dispose() {
    await this.disposable.dispose();
  }
}
