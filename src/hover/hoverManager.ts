import * as vscode from "vscode";

import { ExtensionComponent } from "@/extensionComponent";

import { HoverProvider } from "./hoverProvider";

export class HoverManager implements ExtensionComponent {
  hoverProviders: HoverProvider[];

  constructor() {
    this.hoverProviders = [];
  }

  public activate(context: vscode.ExtensionContext) {
    this.hoverProviders = [
      new HoverProvider(
        [
          "**/pyproject.toml",
          "**/{requirements.txt,requirements-*.txt,*-requirements.txt,*.requirements.txt}",
        ].map((pattern) => {
          return { pattern, scheme: "file" };
        }),
      ),
      new HoverProvider(
        ["**/Gemfile", "**/*.gemspec"].map((pattern) => {
          return { pattern, scheme: "file" };
        }),
      ),
      new HoverProvider(
        ["**/.github/workflows/*.{yml,yaml}"].map((pattern) => {
          return { pattern, scheme: "file" };
        }),
      ),
    ];
    this.hoverProviders.forEach((provider) => provider.activate(context));
  }
}
