import * as vscode from "vscode";

import { API } from "@/api";
import { parse, pkgValRegExp } from "@/format/pip";

import { AbstractHoverProvider } from "../abstractHoverProvider";

export class RequirementsHoverProvider extends AbstractHoverProvider {
  constructor() {
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

    super(selector, { getPackage: API.getPypiPackage });

    this.parseLine = parse;
  }

  public parseDocumentPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ) {
    return document.getWordRangeAtPosition(position, pkgValRegExp);
  }
}
