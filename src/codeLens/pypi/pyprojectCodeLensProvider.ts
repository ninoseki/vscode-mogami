import * as vscode from "vscode";

import { API } from "@/api";
import { CodeLensState } from "@/contextState";
import { buildDepsRegExp, parse as _parse } from "@/format/poetry";
import { DependencyPositionType } from "@/schemas";
import { satisfies } from "@/versioning/poetry";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { createDependencyPositions } from "../dependencyPositionFactory";

export class PyProjectCodeLensProvider extends AbstractCodeLensProvider {
  constructor(state: CodeLensState, concurrency: number) {
    super(
      {
        pattern: "**/pyproject.toml",
        scheme: "file",
      },
      {
        state,
        getPackage: API.getPypiPackage,
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
