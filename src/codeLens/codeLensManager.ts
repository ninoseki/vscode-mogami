import * as vscode from "vscode";

import { ExtensionComponent } from "@/extensionComponent";

import { AbstractCodeLensProvider } from "./abstractCodeLensProvider";
import { GemfileCodelensProvider } from "./gem/gemfileCodeLensProvider";
import { GemspecCodelensProvider } from "./gem/gemspecCodeLensProvider";
import { PyProjectCodeLensProvider } from "./pypi/pyprojectCodeLensProvider";
import { RequirementsCodeLensProvider } from "./pypi/requirementsCodeLensProvider";

export class CodeLensManager implements ExtensionComponent {
  private codeLensProviders: AbstractCodeLensProvider[] = [];

  constructor() {
    this.codeLensProviders = [
      new RequirementsCodeLensProvider(),
      new PyProjectCodeLensProvider(),
      new GemfileCodelensProvider(),
      new GemspecCodelensProvider(),
    ];
  }

  public activate(context: vscode.ExtensionContext) {
    this.codeLensProviders.forEach((provider) => provider.activate(context));
  }
}
