import * as vscode from "vscode";

import { OnShowClickCommand } from "@/constants";
import { CodeLensState } from "@/contextState";

import { AbstractCodeLensProvider } from "./abstractCodeLensProvider";

export class OnShowClick {
  disposable: vscode.Disposable;
  codeLensProviders: AbstractCodeLensProvider[];
  state: CodeLensState;

  constructor(
    codeLensProviders: AbstractCodeLensProvider[],
    state: CodeLensState,
  ) {
    this.state = state;
    this.codeLensProviders = codeLensProviders;
    this.disposable = vscode.commands.registerCommand(
      OnShowClickCommand,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.execute,
      this,
    );
  }

  async execute() {
    await this.state.enableShow();

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
