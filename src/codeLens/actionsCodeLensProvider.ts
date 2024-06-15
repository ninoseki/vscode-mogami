import * as vscode from "vscode";

import { GitHubClient } from "@/package/github";
import { createProject } from "@/project/actions";
import { DependencyPositionType } from "@/schemas";
import { satisfies } from "@/versioning/utils";

import { AbstractCodeLensProvider } from "./abstractCodeLensProvider";
import { CodeLensState } from "./codeLensState";
import { createDependencyPositions } from "./dependencyPositionFactory";

export class ActionsCodeLensProvider extends AbstractCodeLensProvider {
  declare client: GitHubClient;

  constructor({ state }: { state: CodeLensState }) {
    super(
      ["**/.github/workflows/*.yml", "**/.github/workflows/*.yaml"].map(
        (pattern) => {
          return { pattern, scheme: "file" };
        },
      ),
      {
        state,
        satisfies,
      },
    );
    this.name = "ActionsCodeLensProvider";
    this.client = new GitHubClient();
  }

  parseDocuments(document: vscode.TextDocument): DependencyPositionType[] {
    const project = createProject(document);
    this.client = project.getClient();
    return createDependencyPositions(document, { parse: project.getParseFn() });
  }
}
