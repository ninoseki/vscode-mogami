import * as vscode from "vscode";

import { API } from "@/api";
import { AbstractHoverProvider } from "@/hover/abstractHoverProvider";
import type { DependencyType } from "@/schemas";

export class BaseGemHoverProvider extends AbstractHoverProvider {
  private regExp: RegExp;
  private parse: (line: string) => DependencyType | undefined;

  constructor({
    regExp,
    parse,
    documentSelector,
  }: {
    regExp: RegExp;
    parse: (line: string) => DependencyType | undefined;
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

    const dependency = this.parse(line);
    if (!dependency) {
      return;
    }

    return (await API.safeGetGem(dependency.name))
      .map((pkg) => {
        const message = `${pkg.summary}\n\nLatest version: ${pkg.version}\n\n${pkg.url}`;
        return new vscode.Hover(message, range);
      })
      .unwrapOr(undefined);
  }
}
