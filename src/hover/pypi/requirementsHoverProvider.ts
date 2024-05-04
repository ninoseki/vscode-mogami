import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
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

    const dependency = parse(line);
    if (!dependency) {
      return;
    }

    const task = API.safeGetPypiPackage(dependency.name);
    const result = await task();
    return pipe(
      result,
      E.map((pkg) => {
        const message = `${pkg.summary}\n\nLatest version: ${pkg.version}\n\n${pkg.url}`;
        return new vscode.Hover(message, range);
      }),
      E.getOrElseW(() => undefined),
    );
  }
}
