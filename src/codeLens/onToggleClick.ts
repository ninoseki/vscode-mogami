import * as vscode from "vscode";

import { OnToggleClickCommand } from "@/constants";
import { CodeLensState } from "@/contextState";

import { AbstractCodeLensProvider } from "./abstractCodeLensProvider";

export class OnToggleClick {
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
      OnToggleClickCommand,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.execute,
      this,
    );
  }

  async execute() {
    await this.state.toggleShow();

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
