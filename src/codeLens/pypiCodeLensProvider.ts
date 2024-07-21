import * as vscode from "vscode";

import { createProject } from "@/project/pypi";
import { satisfies } from "@/versioning/poetry";

import { AbstractCodeLensProvider } from "./abstractCodeLensProvider";
import { CodeLensState } from "./codeLensState";

export class PyPICodeLensProvider extends AbstractCodeLensProvider {
  constructor({ state }: { state: CodeLensState }) {
    super(
      [
        "**/pyproject.toml",
        "**/{requirements.txt,requirements-*.txt,*-requirements.txt,*.requirements.txt}",
      ].map((pattern) => {
        return { pattern, scheme: "file" };
      }),
      {
        state,
        satisfies,
      },
    );
    this.name = "PyPICodeLensProvider";
  }

  createProject(document: vscode.TextDocument) {
    return createProject(document);
  }
}
