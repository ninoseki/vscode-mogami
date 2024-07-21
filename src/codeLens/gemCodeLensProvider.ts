import * as vscode from "vscode";

import { createProject } from "@/project/gem";
import { satisfies } from "@/versioning/gem";

import { AbstractCodeLensProvider } from "./abstractCodeLensProvider";
import { CodeLensState } from "./codeLensState";

export class GemfileCodeLensProvider extends AbstractCodeLensProvider {
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
  }

  createProject(document: vscode.TextDocument) {
    return createProject(document);
  }
}
