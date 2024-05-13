import * as vscode from "vscode";

import { gemfileRegExp, parse } from "@/format/gemfile";
import { PackageClientType } from "@/schemas";

import { AbstractHoverProvider } from "../abstractHoverProvider";

export class GemfileHoverProvider extends AbstractHoverProvider {
  constructor(client: PackageClientType) {
    super(
      {
        pattern: "**/Gemfile",
        scheme: "file",
      },
      { client },
    );
    this.parseLine = parse;
  }

  public parseDocumentPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ) {
    return document.getWordRangeAtPosition(position, gemfileRegExp);
  }
}
