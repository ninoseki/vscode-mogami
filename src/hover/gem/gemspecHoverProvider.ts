import * as vscode from "vscode";

import { gemspecRegExp, parse } from "@/format/gemspec";
import { getPackage } from "@/package/gem";

import { AbstractHoverProvider } from "../abstractHoverProvider";

export class GemspecHoverProvider extends AbstractHoverProvider {
  constructor() {
    super(
      {
        pattern: "**/*.gemspec",
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
    return document.getWordRangeAtPosition(position, gemspecRegExp);
  }
}
