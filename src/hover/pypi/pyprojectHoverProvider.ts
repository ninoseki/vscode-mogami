import * as vscode from "vscode";

import { API } from "@/api";
import { buildDepsRegExp, parse } from "@/format/poetry";

import { AbstractHoverProvider } from "../abstractHoverProvider";
import { buildHoverMessage } from "./common";

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

    const depPos = parse(line, depsRegExp);
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
