import * as vscode from "vscode";

import { gemspecRegExp, parse } from "@/format/gemspec";
import { PackageClientType } from "@/schemas";

import { AbstractHoverProvider } from "../abstractHoverProvider";

export class GemspecHoverProvider extends AbstractHoverProvider {
  constructor(client: PackageClientType) {
    super(
      {
        pattern: "**/*.gemspec",
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
    return document.getWordRangeAtPosition(position, gemspecRegExp);
  }
}
