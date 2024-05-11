import * as vscode from "vscode";

import { API } from "@/api";
import { buildDepsRegExp, parse as _parse } from "@/format/poetry";
import { DependencyPositionType } from "@/schemas";
import { satisfies } from "@/versioning/poetry";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { createDependencyPositions } from "../dependencyPositionFactory";

export class PyProjectCodeLensProvider extends AbstractCodeLensProvider {
  constructor(concurrency: number) {
    super(
      {
        pattern: "**/pyproject.toml",
        scheme: "file",
      },
      {
        getPackage: API.getPypiPackage,
        satisfies,
        concurrency,
      },
    );
  }
  parseDocuments(document: vscode.TextDocument): DependencyPositionType[] {
    const depsRegExp = buildDepsRegExp(document.getText());
    const parse = (line: string) => {
      return _parse(line, depsRegExp);
    };
    return createDependencyPositions(document, { parse });
  }
}
