import * as vscode from "vscode";

import { projectFormatToDocumentSelector } from "@/constants";
import { ExtensionComponent } from "@/extensionComponent";
import { ProjectParser } from "@/project";

import { HoverProvider } from "./hoverProvider";

export class HoverManager implements ExtensionComponent {
  hoverProviders: HoverProvider[];

  constructor() {
    this.hoverProviders = [];
  }

  public activate(context: vscode.ExtensionContext) {
    this.hoverProviders = Array.from(projectFormatToDocumentSelector).map(
      ([projectFormat, documentSelector]) => {
        return new HoverProvider(
          documentSelector,
          new ProjectParser(projectFormat),
        );
      },
    );

    this.hoverProviders.forEach((provider) => provider.activate(context));
  }
}
