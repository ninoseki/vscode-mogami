import * as vscode from "vscode";

import { createProject } from "@/project/actions";
import { satisfies } from "@/versioning/utils";

import { AbstractCodeLensProvider } from "./abstractCodeLensProvider";
import { CodeLensState } from "./codeLensState";

export class ActionsCodeLensProvider extends AbstractCodeLensProvider {
  constructor({ state }: { state: CodeLensState }) {
    super(
      ["**/.github/workflows/*.{yaml,yml}"].map((pattern) => {
        return { pattern, scheme: "file" };
      }),
      {
        state,
        satisfies,
      },
    );
    this.name = "ActionsCodeLensProvider";
  }

  createProject(document: vscode.TextDocument) {
    return createProject(document);
  }
}
