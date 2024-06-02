import * as vscode from "vscode";

import { ExtensionComponent } from "@/extensionComponent";

import { AbstractHoverProvider } from "./abstractHoverProvider";
import { GemfileProvider } from "./gemHoverProvider";
import { PyPIHoverProvider } from "./pypiHoverProvider";

export class HoverManager implements ExtensionComponent {
  hoverProviders: AbstractHoverProvider[];

  constructor() {
    this.hoverProviders = [];
  }

  public activate(context: vscode.ExtensionContext) {
    this.hoverProviders = [new PyPIHoverProvider(), new GemfileProvider()];
    this.hoverProviders.forEach((provider) => provider.activate(context));
  }
}
