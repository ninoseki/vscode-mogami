import * as vscode from "vscode";

import { API } from "@/api";
import { AbstractCodeLensProvider } from "@/codeLens/abstractCodeLensProvider";
import { GemSuggestionProvider } from "@/suggestion/gem/gemSuggestionProvider";
import type { GemDependency } from "@/types";
import { extractDependencyByMapper } from "@/utils/gem";

export class BaseGemCodeLensProvider extends AbstractCodeLensProvider {
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

  public async provideCodeLenses(document: vscode.TextDocument) {
    const codeLenses: vscode.CodeLens[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const matches = this.regexp.exec(line.text.trim());
      if (!matches) {
        continue;
      }

      const dependency = extractDependencyByMapper(
        line.text.trim(),
        this.mapper,
      );
      if (!dependency) {
        continue;
      }

      const result = await API.safeGetGem(dependency.name);
      if (result.isErr()) {
        continue;
      }

      const gem = result.value;
      const indexOf = line.text.indexOf(matches[0]);
      const position = new vscode.Position(line.lineNumber, indexOf);
      const range = document.getWordRangeAtPosition(position, this.regexp);
      if (range) {
        const codeLens = new vscode.CodeLens(range);
        const suggestionProvider = new GemSuggestionProvider(dependency, gem);
        codeLens.command = suggestionProvider.suggest();
        codeLenses.push(codeLens);
      }
    }

    return codeLenses;
  }
}
