import * as vscode from "vscode";

import { getEnableCodeLens } from "@/configuration";
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
    const enableCodeLens = getEnableCodeLens();

    if (!enableCodeLens) {
      return;
    }

    const state = new CodeLensState();
    await state.applyDefaults();

    this.codeLensProviders = [
      new PyPICodeLensProvider({ state }),
      new GemfileCodeLensProvider({ state }),
    ];

    this.codeLensProviders.forEach((provider) => {
      provider.activate(context);
    });

    new OnShowClick(this.codeLensProviders, state);
    new OnHideClick(this.codeLensProviders, state);
    new OnActiveTextEditorChange(this.codeLensProviders, state);
    new OnUpdateDependencyClick();
  }
}
