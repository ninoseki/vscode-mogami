import * as vscode from "vscode";

import { projectFormatsToDocumentSelector } from "@/constants";
import { ExtensionComponent } from "@/extensionComponent";

import { HoverProvider } from "./hoverProvider";

export class HoverManager implements ExtensionComponent {
  hoverProviders: HoverProvider[];

  constructor() {
    this.hoverProviders = [];
  }

  public activate(context: vscode.ExtensionContext) {
    this.hoverProviders = Array.from(projectFormatsToDocumentSelector).map(
      ([projectFormats, documentSelector]) => {
        return new HoverProvider(documentSelector, projectFormats);
      },
    );
    this.hoverProviders.forEach((provider) => provider.activate(context));
  }
}
