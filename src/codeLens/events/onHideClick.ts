import * as vscode from "vscode";

import { OnHideClickCommand } from "@/constants";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { CodeLensState } from "../codeLensState";

export class OnHideClick {
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
      OnHideClickCommand,
      // eslint-disable-next-line @typescript-eslint/unbound-method
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
