import * as vscode from "vscode";

import { parse, pkgValRegExp } from "@/format/pip";
import { PackageClientType } from "@/schemas";

import { AbstractHoverProvider } from "../abstractHoverProvider";

export class RequirementsHoverProvider extends AbstractHoverProvider {
  constructor(client: PackageClientType) {
    const patterns = [
      "**/*-requirements.txt",
      "**/*.requirements.txt",
      "**/requirements-*.txt",
      "**/requirements.txt",
      "**/requirements/*.txt",
    ];
    const selector = patterns.map((pattern) => {
      return { pattern, scheme: "file" };
    });

    super(selector, { client });

    this.parseLine = parse;
  }

  public parseDocumentPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ) {
    return document.getWordRangeAtPosition(position, pkgValRegExp);
  }
}
