import * as vscode from "vscode";

import { createPythonProject } from "@/format/pypi";
import { PyPIClient } from "@/package/pypi";
import { DependencyPositionType, PackageClientType } from "@/schemas";
import { satisfies } from "@/versioning/poetry";

import { AbstractCodeLensProvider } from "./abstractCodeLensProvider";
import { CodeLensState } from "./codeLensState";
import { createDependencyPositions } from "./dependencyPositionFactory";

export class PyPICodeLensProvider extends AbstractCodeLensProvider {
  declare client: PyPIClient;

  constructor({
    state,
    concurrency,
    client,
  }: {
    state: CodeLensState;
    concurrency: number;
    client: PackageClientType;
  }) {
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
        client,
        satisfies,
        concurrency,
      },
    );
    this.name = "PyPICodeLensProvider";
  }

  parseDocuments(document: vscode.TextDocument): DependencyPositionType[] {
    const project = createPythonProject(document);
    this.client = project.getClient();
    const parse = project.getParseFn();
    return createDependencyPositions(document, { parse });
  }
}
