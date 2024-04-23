import { zipWith } from "fp-ts/Array";
import { err, ok } from "neverthrow";
import pLimit from "p-limit";
import * as vscode from "vscode";

import { API } from "@/api";
import { AbstractCodeLensProvider } from "@/codeLens/abstractCodeLensProvider";
import { GemSuggestionProvider } from "@/suggestion/gem/gemSuggestionProvider";
import type { GemDependency } from "@/types";
import { extractDependencyByMapper } from "@/utils/gem";

interface Container {
  line: vscode.TextLine;
  deps: GemDependency;
  match: string;
}

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
    const lineDeps: Container[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const matches = this.regexp.exec(line.text.trim());
      if (!matches) {
        continue;
      }

      const deps = extractDependencyByMapper(line.text.trim(), this.mapper);
      if (!deps) {
        continue;
      }

      lineDeps.push({ line, deps, match: matches[0] });
    }

    const limit = pLimit(5);
    const input = lineDeps.map((x) =>
      limit(() => {
        return API.safeGetGem(x.deps.name);
      }),
    );
    const results = await Promise.all(input);

    const zipped = zipWith(lineDeps, results, (lineDep, result) => {
      return { lineDep, result };
    });

    return zipped
      .map((item) => {
        const line = item.lineDep.line;
        const match = item.lineDep.match;
        const deps = item.lineDep.deps;

        return item.result.andThen((gem) => {
          const indexOf = line.text.indexOf(match);
          const position = new vscode.Position(
            item.lineDep.line.lineNumber,
            indexOf,
          );
          const range = document.getWordRangeAtPosition(position, this.regexp);
          if (range) {
            const codeLens = new vscode.CodeLens(range);
            const suggestionProvider = new GemSuggestionProvider(deps, gem);
            codeLens.command = suggestionProvider.suggest();
            return ok(codeLens);
          }
          return err("range not found");
        });
      })
      .map((result) => {
        if (result.isOk()) {
          return result.value;
        }
        return undefined;
      })
      .filter(
        (item): item is Exclude<typeof item, undefined> => item !== undefined,
      );
  }
}
