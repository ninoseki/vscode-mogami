import * as vscode from "vscode";

import { OnShowClickCommand } from "@/constants";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { CodeLensState } from "../codeLensState";

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
      .filter((provider) => provider.isActive())
      .forEach((provider) => {
        provider.reloadCodeLenses();
      });
  }

  async dispose() {
    await this.disposable.dispose();
  }
}
