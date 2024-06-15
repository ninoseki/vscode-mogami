import * as vscode from "vscode";

import { GitHubClient } from "@/package/github";
import { createProject } from "@/project/actions";

import { AbstractHoverProvider } from "./abstractHoverProvider";

export class ActionsProvider extends AbstractHoverProvider {
  declare client: GitHubClient;

  constructor() {
    super(
      ["**/.github/workflows/*.yml", "**/.github/workflows/*.yaml"].map(
        (pattern) => {
          return { pattern, scheme: "file" };
        },
      ),
    );
    this.client = new GitHubClient();
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
