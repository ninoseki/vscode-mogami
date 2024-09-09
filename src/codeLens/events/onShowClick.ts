import * as vscode from "vscode";

import { CodeLensProvider } from "@/codeLens/codeLensProvider";
import { CodeLensState } from "@/codeLens/codeLensState";
import { OnShowClickCommand } from "@/constants";

export class OnShowClick {
  disposable: vscode.Disposable;
  codeLensProviders: CodeLensProvider[];
  state: CodeLensState;

  constructor(codeLensProviders: CodeLensProvider[], state: CodeLensState) {
    this.state = state;
    this.codeLensProviders = codeLensProviders;

    this.disposable = vscode.commands.registerCommand(
      OnShowClickCommand,
      this.execute,
      this,
    );
  }

  async execute() {
    await this.state.enableShow();

    this.codeLensProviders
      .filter((provider) => provider.isActive())
      .forEach((provider) => {
        provider.reloadCodeLenses();
      });
  }

  async dispose() {
    await this.disposable.dispose();
  }
}
