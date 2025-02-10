import * as vscode from "vscode";

import { getConcurrency, getEnableCodeLens } from "@/configuration";
import { projectFormatToDocumentSelector } from "@/constants";
import { ExtensionComponent } from "@/extensionComponent";
import { ProjectParser } from "@/project";

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

    const concurrency = getConcurrency();

    this.codeLensProviders = Array.from(projectFormatToDocumentSelector).map(
      ([projectFormat, documentSelector]) => {
        const name = `${projectFormat}-CodeLensProvider`;
        return new CodeLensProvider(
          documentSelector,
          new ProjectParser(projectFormat),
          concurrency,
          state,
          name,
        );
      },
    );

    this.codeLensProviders.forEach((provider) => {
      provider.activate(context);
    });

    new OnShowClick(this.codeLensProviders, state);
    new OnHideClick(this.codeLensProviders, state);
    new OnActiveTextEditorChange(this.codeLensProviders, state);
    new OnUpdateDependencyClick();
  }
}
