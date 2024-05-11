import * as vscode from "vscode";

import { gemfileRegExp, parse } from "@/format/gemfile";
import { getPackage } from "@/package/gem";

import { AbstractHoverProvider } from "../abstractHoverProvider";

export class GemfileHoverProvider extends AbstractHoverProvider {
  constructor() {
    super(
      {
        pattern: "**/Gemfile",
        scheme: "file",
      },
      { getPackage },
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
