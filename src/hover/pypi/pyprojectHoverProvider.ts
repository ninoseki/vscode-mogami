import * as vscode from "vscode";

import { API } from "@/api";
import { buildDepsRegExp, parse } from "@/format/poetry";

import { AbstractHoverProvider } from "../abstractHoverProvider";

export class PyProjectHoverProvider extends AbstractHoverProvider {
  constructor() {
    const patterns = ["**/pyproject.toml"];

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
    const depsRegExp = buildDepsRegExp(document.getText());
    const range = document.getWordRangeAtPosition(position, depsRegExp);
    const line = document.lineAt(position.line).text.trim();

    const dependency = parse(line, depsRegExp);
    if (!dependency) {
      return;
    }

    return (await API.safeGetPypiPackage(dependency.name))
      .map((pkg) => {
        const message = `${pkg.summary}\n\nLatest version: ${pkg.version}\n\n${pkg.url}`;
        return new vscode.Hover(message, range);
      })
      .unwrapOr(undefined);
  }
}
