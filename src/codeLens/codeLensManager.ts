import * as vscode from "vscode";

import { ConcurrencyKey, EnableCodeLensKey, ExtID } from "@/constants";
import { CodeLensState } from "@/contextState";
import { ExtensionComponent } from "@/extensionComponent";
import { GemClient } from "@/package/gem";
import { PyPIClient } from "@/package/pypi";

import { AbstractCodeLensProvider } from "./abstractCodeLensProvider";
import { OnActiveTextEditorChange } from "./events/onActiveTextEditorChange";
import { OnHideClick } from "./events/onHideClick";
import { OnShowClick } from "./events/onShowClick";
import { OnUpdateDependencyClick } from "./events/onUpdateDependencyClick";
import { GemfileCodeLensProvider } from "./gem/gemfileCodeLensProvider";
import { GemspecCodeLensProvider } from "./gem/gemspecCodeLensProvider";
import { PyProjectCodeLensProvider } from "./pypi/pyprojectCodeLensProvider";
import { RequirementsCodeLensProvider } from "./pypi/requirementsCodeLensProvider";

export class CodeLensManager implements ExtensionComponent {
  codeLensProviders: AbstractCodeLensProvider[];

  constructor() {
    this.codeLensProviders = [];
  }

  public activate(context: vscode.ExtensionContext) {
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

    const gemClient = new GemClient();
    const pypiClient = new PyPIClient();

    this.codeLensProviders = [
      new PyProjectCodeLensProvider({ state, concurrency, client: pypiClient }),
      new RequirementsCodeLensProvider({
        state,
        concurrency,
        client: pypiClient,
      }),
      new GemfileCodeLensProvider({ state, concurrency, client: gemClient }),
      new GemspecCodeLensProvider({ state, concurrency, client: gemClient }),
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
