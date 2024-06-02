import * as vscode from "vscode";

import { PyPIClient } from "@/package/pypi";
import { createProject } from "@/project/pypi";
import { DependencyPositionType } from "@/schemas";
import { satisfies } from "@/versioning/poetry";

import { AbstractCodeLensProvider } from "./abstractCodeLensProvider";
import { CodeLensState } from "./codeLensState";
import { createDependencyPositions } from "./dependencyPositionFactory";

export class PyPICodeLensProvider extends AbstractCodeLensProvider {
  declare client: PyPIClient;

  constructor({ state }: { state: CodeLensState }) {
    super(
      [
        "**/pyproject.toml",
        "**/*-requirements.txt",
        "**/*.requirements.txt",
        "**/requirements-*.txt",
        "**/requirements.txt",
        "**/requirements/*.txt",
      ].map((pattern) => {
        return { pattern, scheme: "file" };
      }),
      {
        state,
        satisfies,
      },
    );
    this.name = "PyPICodeLensProvider";
    this.client = new PyPIClient();
  }

  parseDocuments(document: vscode.TextDocument): DependencyPositionType[] {
    const project = createProject(document);
    this.client = project.getClient();
    return createDependencyPositions(document, { parse: project.getParseFn() });
  }
}
