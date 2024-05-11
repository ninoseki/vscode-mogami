import * as vscode from "vscode";

import { API } from "@/api";
import { buildDepsRegExp, parse } from "@/format/poetry";
import { ParseFnType } from "@/types";

import { AbstractHoverProvider } from "../abstractHoverProvider";

export class PyProjectHoverProvider extends AbstractHoverProvider {
  parseLine?: ParseFnType;

  constructor() {
    super(
      { pattern: "**/pyproject.toml", scheme: "file" },
      { getPackage: API.getPypiPackage },
    );
    this.parseLine = undefined;
  }

  public parseDocumentPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ) {
    const depsRegExp = buildDepsRegExp(document.getText());
    const parseLine = (line: string) => {
      return parse(line, depsRegExp);
    };
    this.parseLine = parseLine;

    return document.getWordRangeAtPosition(position, depsRegExp);
  }
}
