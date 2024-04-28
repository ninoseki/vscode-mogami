import * as vscode from "vscode";

import { API } from "@/api";
import { parse, pkgValRegExp } from "@/format/pip";

import { AbstractHoverProvider } from "../abstractHoverProvider";
import { buildHoverMessage } from "./common";

export class RequirementsHoverProvider extends AbstractHoverProvider {
  constructor() {
    const patterns = [
      "**/*-requirements.txt",
      "**/*.requirements.txt",
      "**/requirements-*.txt",
      "**/requirements.txt",
      "**/requirements/*.txt",
    ];

    super(
      patterns.map((pattern) => {
        return { pattern, scheme: "file" };
      }),
    );
  }

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ) {
    const range = document.getWordRangeAtPosition(position, pkgValRegExp);
    const line = document.lineAt(position.line).text.trim();

    const depPos = parse(line);
    if (!depPos) {
      return;
    }

    const result = await API.safeGetPypiPackage(depPos.name);
    if (result.isErr()) {
      return;
    }

    const pkg = result.value;
    const message = buildHoverMessage(pkg);
    const link = new vscode.Hover(message, range);
    return link;
  }
}
