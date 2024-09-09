import * as vscode from "vscode";

import { getEnableCodeLens } from "@/configuration";
import { ExtensionComponent } from "@/extensionComponent";

import { CodeLensProvider } from "./codeLensProvider";
import { CodeLensState } from "./codeLensState";
import { OnActiveTextEditorChange } from "./events/onActiveTextEditorChange";
import { OnHideClick } from "./events/onHideClick";
import { OnShowClick } from "./events/onShowClick";
import { OnUpdateDependencyClick } from "./events/onUpdateDependencyClick";

export class CodeLensManager implements ExtensionComponent {
  codeLensProviders: CodeLensProvider[];

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
      new CodeLensProvider(
        [
          "**/pyproject.toml",
          "**/{requirements.txt,requirements-*.txt,*-requirements.txt,*.requirements.txt}",
        ].map((pattern) => {
          return { pattern, scheme: "file" };
        }),
        state,
        "PyPICodeLensProvider",
      ),
      new CodeLensProvider(
        ["**/Gemfile", "**/*.gemspec"].map((pattern) => {
          return { pattern, scheme: "file" };
        }),
        state,
        "GemCodeLensProvider",
      ),
      new CodeLensProvider(
        ["**/.github/workflows/*.{yml,yaml}"].map((pattern) => {
          return { pattern, scheme: "file" };
        }),
        state,
        "ActionsCodeLensProvider",
      ),
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
