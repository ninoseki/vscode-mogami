import * as vscode from "vscode";

import { API } from "@/api";
import { AbstractHoverProvider } from "@/hover/abstractHoverProvider";
import type { DependencyPosType } from "@/schemas";

export class BaseGemHoverProvider extends AbstractHoverProvider {
  private regExp: RegExp;
  private parse: (line: string) => DependencyPosType | undefined;

  constructor({
    regExp,
    parse,
    documentSelector,
  }: {
    regExp: RegExp;
    parse: (line: string) => DependencyPosType | undefined;
    documentSelector: vscode.DocumentSelector;
  }) {
    super(documentSelector);

    this.parse = parse;
    this.regExp = regExp;
  }

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.Hover | undefined> {
    const range = document.getWordRangeAtPosition(position, this.regExp);
    const line = document.lineAt(position.line).text.trim();

    const depsPos = this.parse(line);
    if (!depsPos) {
      return;
    }

    const result = await API.safeGetGem(depsPos.name);
    return result
      .map((pkg) => {
        const message = `${pkg.summary}\n\nLatest version: ${pkg.version}\n\n${pkg.url}`;
        return new vscode.Hover(message, range);
      })
      .unwrapOr(undefined);
  }
}
