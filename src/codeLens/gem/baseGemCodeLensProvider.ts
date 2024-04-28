import { zipWith } from "fp-ts/Array";
import { err, ok } from "neverthrow";
import pLimit from "p-limit";
import * as vscode from "vscode";

import { API } from "@/api";
import { AbstractCodeLensProvider } from "@/codeLens/abstractCodeLensProvider";
import { DependencyPosLineType, DependencyPosType } from "@/schemas";
import { GemSuggestionProvider } from "@/suggestion/gem/gemSuggestionProvider";

export class BaseGemCodeLensProvider extends AbstractCodeLensProvider {
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

  public async provideCodeLenses(document: vscode.TextDocument) {
    const depsPosLines: DependencyPosLineType[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const depsPos = this.parse(line.text);
      if (!depsPos) {
        continue;
      }
      depsPosLines.push({ ...depsPos, line: line.lineNumber });
    }

    const limit = pLimit(5);
    const input = depsPosLines.map((x) =>
      limit(() => {
        return API.safeGetGem(x.name);
      }),
    );
    const results = await Promise.all(input);

    const zipped = zipWith(depsPosLines, results, (depPosLine, result) => {
      return { depPosLine, result };
    });
    return zipped
      .map((item) => {
        const line = document.lineAt(item.depPosLine.line);
        const { name, specifier } = item.depPosLine;

        return item.result.andThen((pkg) => {
          const position = new vscode.Position(
            line.lineNumber,
            item.depPosLine.pos,
          );
          const range = document.getWordRangeAtPosition(position, this.regExp);

          if (range) {
            const codeLens = new vscode.CodeLens(range);
            const suggestionProvider = new GemSuggestionProvider(
              { name, specifier },
              pkg,
            );
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
