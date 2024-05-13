import * as vscode from "vscode";

import { ExtensionComponent } from "@/extensionComponent";
import { GemClient } from "@/package/gem";
import { PyPIClient } from "@/package/pypi";

import { AbstractHoverProvider } from "./abstractHoverProvider";
import { GemfileHoverProvider } from "./gem/gemfileHoverProvider";
import { GemspecHoverProvider } from "./gem/gemspecHoverProvider";
import { PyProjectHoverProvider } from "./pypi/pyprojectHoverProvider";
import { RequirementsHoverProvider } from "./pypi/requirementsHoverProvider";

export class HoverManager implements ExtensionComponent {
  hoverProviders: AbstractHoverProvider[];

  constructor() {
    this.hoverProviders = [];
  }

  public activate(context: vscode.ExtensionContext) {
    const gemClient = new GemClient();
    const pypiClient = new PyPIClient();

    this.hoverProviders = [
      new PyProjectHoverProvider(pypiClient),
      new RequirementsHoverProvider(pypiClient),
      new GemspecHoverProvider(gemClient),
      new GemfileHoverProvider(gemClient),
    ];

    this.hoverProviders.forEach((provider) => provider.activate(context));
  }
}
