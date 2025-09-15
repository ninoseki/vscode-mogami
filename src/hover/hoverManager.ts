import * as vscode from "vscode";

import { projectFormatToSelector } from "@/constants";
import { ExtensionComponent } from "@/extensionComponent";

import { HoverProvider } from "./hoverProvider";

export class HoverManager implements ExtensionComponent {
  hoverProviders: HoverProvider[];

  constructor() {
    this.hoverProviders = [];
  }

  public activate(context: vscode.ExtensionContext) {
    this.hoverProviders = Array.from(projectFormatToSelector).map(
      ([projectFormat, selector]) => {
        return new HoverProvider(context, selector, projectFormat);
      },
    );

    this.hoverProviders.forEach((provider) => provider.activate(context));
  }
}
