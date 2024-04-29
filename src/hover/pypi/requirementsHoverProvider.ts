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

    const depsPos = parse(line);
    if (!depsPos) {
      return;
    }

    const result = await API.safeGetPypiPackage(depsPos.name);
    return result
      .map((pkg) => {
        const message = `${pkg.summary}\n\nLatest version: ${pkg.version}\n\n${pkg.url}`;
        return new vscode.Hover(message, range);
      })
      .unwrapOr(undefined);
  }
}
