import * as vscode from "vscode";

import { buildDepsRegExp, parse } from "@/format/poetry";
import { PackageClientType } from "@/schemas";

import { AbstractHoverProvider } from "../abstractHoverProvider";

export class PyProjectHoverProvider extends AbstractHoverProvider {
  constructor(client: PackageClientType) {
    super({ pattern: "**/pyproject.toml", scheme: "file" }, { client });
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
