import * as vscode from "vscode";

import { GemClient } from "@/package/gem";
import { createProject } from "@/project/gem";

import { AbstractHoverProvider } from "./abstractHoverProvider";

export class GemfileProvider extends AbstractHoverProvider {
  declare client: GemClient;

  constructor() {
    super(
      ["**/Gemfile", "**/*.gemspec"].map((pattern) => {
        return { pattern, scheme: "file" };
      }),
    );
    this.client = new GemClient();
  }

  createProject(document: vscode.TextDocument) {
    return createProject(document);
  }
}
