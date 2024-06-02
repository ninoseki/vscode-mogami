import * as vscode from "vscode";

import { GemClient } from "@/package/gem";
import { createProject } from "@/project/gem";
import { DependencyPositionType } from "@/schemas";
import { satisfies } from "@/versioning/gem";

import { AbstractCodeLensProvider } from "./abstractCodeLensProvider";
import { CodeLensState } from "./codeLensState";
import { createDependencyPositions } from "./dependencyPositionFactory";

export class GemfileCodeLensProvider extends AbstractCodeLensProvider {
  declare client: GemClient;

  constructor({ state }: { state: CodeLensState }) {
    super(
      ["**/Gemfile", "**/*.gemspec"].map((pattern) => {
        return { pattern, scheme: "file" };
      }),
      {
        state,
        satisfies,
      },
    );
    this.name = "GemCodeLensProvider";
    this.client = new GemClient();
  }

  parseDocuments(document: vscode.TextDocument): DependencyPositionType[] {
    const project = createProject(document);
    this.client = project.getClient();
    return createDependencyPositions(document, { parse: project.getParseFn() });
  }
}
