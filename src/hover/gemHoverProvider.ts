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

  public parseDocumentPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ) {
    const project = createProject(document);

    this.client = project.getClient();
    this.parse = project.getParseFn();
    return document.getWordRangeAtPosition(position, project.getRegex());
  }
}
