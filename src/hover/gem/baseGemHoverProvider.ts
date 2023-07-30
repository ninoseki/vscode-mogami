import * as vscode from "vscode";

import { API } from "@/api";
import { AbstractHoverProvider } from "@/hover/abstractHoverProvider";
import { GemDependency } from "@/types";
import { buildMessage, extractDependencyByMapper } from "@/utils/gem";

export class BaseGemHoverProvider extends AbstractHoverProvider {
  private regexp: RegExp;
  private mapper: (s: string) => GemDependency | undefined;

  constructor({
    regexp,
    mapper,
    documentSelector,
  }: {
    regexp: RegExp;
    mapper: (s: string) => GemDependency | undefined;
    documentSelector: vscode.DocumentSelector;
  }) {
    super(documentSelector);

    this.mapper = mapper;
    this.regexp = regexp;
  }

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.Hover | undefined> {
    const range = document.getWordRangeAtPosition(position, this.regexp);
    const line = document.lineAt(position.line).text.trim();

    const dependency = extractDependencyByMapper(line, this.mapper);
    if (!dependency) {
      return;
    }

    const gem = await API.getGem(dependency.name);

    if (!gem) {
      return;
    }

    const message = buildMessage(gem);
    const link = new vscode.Hover(message, range);
    return link;
  }
}
