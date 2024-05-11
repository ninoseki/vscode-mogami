import * as vscode from "vscode";

import { ExtensionComponent } from "@/extensionComponent";

import { AbstractHoverProvider } from "./abstractHoverProvider";
import { GemfileHoverProvider } from "./gem/gemfileHoverProvider";
import { GemspecHoverProvider } from "./gem/gemspecHoverProvider";
import { PyProjectHoverProvider } from "./pypi/pyprojectHoverProvider";
import { RequirementsHoverProvider } from "./pypi/requirementsHoverProvider";

export class HoverManager implements ExtensionComponent {
  private hoverProviders: AbstractHoverProvider[] = [];

  constructor() {
    this.hoverProviders = [
      new PyProjectHoverProvider(),
      new RequirementsHoverProvider(),
      new GemspecHoverProvider(),
      new GemfileHoverProvider(),
    ];
  }

  public activate(context: vscode.ExtensionContext) {
    this.hoverProviders.forEach((provider) => provider.activate(context));
  }
}
