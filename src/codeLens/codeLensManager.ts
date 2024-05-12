import * as vscode from "vscode";

import { ConcurrencyKey, EnableCodeLensKey, ExtID } from "@/constants";
import { CodeLensState } from "@/contextState";
import { ExtensionComponent } from "@/extensionComponent";

import { GemfileCodeLensProvider } from "./gem/gemfileCodeLensProvider";
import { GemspecCodeLensProvider } from "./gem/gemspecCodeLensProvider";
import { OnActiveTextEditorChange } from "./onActiveTextEditorChange";
import { OnToggleClick } from "./onToggleClick";
import { OnUpdateDependencyClick } from "./onUpdateDependencyClick";
import { PyProjectCodeLensProvider } from "./pypi/pyprojectCodeLensProvider";
import { RequirementsCodeLensProvider } from "./pypi/requirementsCodeLensProvider";

export class CodeLensManager implements ExtensionComponent {
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

    const codeLensProviders = [
      new PyProjectCodeLensProvider(state, concurrency),
      new RequirementsCodeLensProvider(state, concurrency),
      new GemfileCodeLensProvider(state, concurrency),
      new GemspecCodeLensProvider(state, concurrency),
    ];

    codeLensProviders.forEach((provider) => {
      provider.activate(context);
    });

    new OnToggleClick(codeLensProviders, state);
    new OnActiveTextEditorChange(state);
    new OnUpdateDependencyClick();
  }
}
