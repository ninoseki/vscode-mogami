import * as vscode from "vscode";

import { ConcurrencyKey, EnableCodeLensKey, ExtID } from "@/constants";
import { ExtensionComponent } from "@/extensionComponent";

import { GemfileCodeLensProvider } from "./gem/gemfileCodeLensProvider";
import { GemspecCodeLensProvider } from "./gem/gemspecCodeLensProvider";
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

    const codeLensProviders = [
      new PyProjectCodeLensProvider(concurrency),
      new RequirementsCodeLensProvider(concurrency),
      new GemfileCodeLensProvider(concurrency),
      new GemspecCodeLensProvider(concurrency),
    ];
    codeLensProviders.forEach((provider) => provider.activate(context));
    new OnUpdateDependencyClick();
  }
}
