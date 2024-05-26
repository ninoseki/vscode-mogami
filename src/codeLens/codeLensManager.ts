import * as vscode from "vscode";

import { ConcurrencyKey, EnableCodeLensKey, ExtID } from "@/constants";
import { ExtensionComponent } from "@/extensionComponent";

import { AbstractCodeLensProvider } from "./abstractCodeLensProvider";
import { CodeLensState } from "./codeLensState";
import { OnActiveTextEditorChange } from "./events/onActiveTextEditorChange";
import { OnHideClick } from "./events/onHideClick";
import { OnShowClick } from "./events/onShowClick";
import { OnUpdateDependencyClick } from "./events/onUpdateDependencyClick";
import { GemfileCodeLensProvider } from "./gemCodeLensProvider";
import { PyPICodeLensProvider } from "./pypiCodeLensProvider";

export class CodeLensManager implements ExtensionComponent {
  codeLensProviders: AbstractCodeLensProvider[];

  constructor() {
    this.codeLensProviders = [];
  }

  public async activate(context: vscode.ExtensionContext) {
    const enableCodeLens = vscode.workspace
      .getConfiguration(ExtID)
      .get(EnableCodeLensKey, true);
    const concurrency = vscode.workspace
      .getConfiguration(ExtID)
      .get(ConcurrencyKey, 5);

    if (!enableCodeLens) {
      return;
    }

    const state = new CodeLensState();
    await state.applyDefaults();

    this.codeLensProviders = [
      new PyPICodeLensProvider({ state, concurrency }),
      new GemfileCodeLensProvider({ state, concurrency }),
    ];

    this.codeLensProviders.forEach((provider) => {
      provider.activate(context);
    });

    new OnShowClick(this.codeLensProviders, state);
    new OnHideClick(this.codeLensProviders, state);
    new OnActiveTextEditorChange(state);
    new OnUpdateDependencyClick();
  }
}
