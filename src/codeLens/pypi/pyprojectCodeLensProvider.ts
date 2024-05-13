import * as vscode from "vscode";

import { CodeLensState } from "@/contextState";
import { buildDepsRegExp, parse as _parse } from "@/format/poetry";
import { DependencyPositionType, PackageClientType } from "@/schemas";
import { satisfies } from "@/versioning/poetry";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { createDependencyPositions } from "../dependencyPositionFactory";

export class PyProjectCodeLensProvider extends AbstractCodeLensProvider {
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
      {
        pattern: "**/pyproject.toml",
        scheme: "file",
      },
      {
        state,
        client,
        satisfies,
        concurrency,
      },
    );
    this.name = "PyProjectCodeLensProvider";
  }
  parseDocuments(document: vscode.TextDocument): DependencyPositionType[] {
    const depsRegExp = buildDepsRegExp(document.getText());
    const parse = (line: string) => {
      return _parse(line, depsRegExp);
    };
    return createDependencyPositions(document, { parse });
  }
}
