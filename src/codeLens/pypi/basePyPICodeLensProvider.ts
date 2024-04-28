import { zipWith } from "fp-ts/Array";
import { err, ok } from "neverthrow";
import pLimit from "p-limit";
import * as vscode from "vscode";

import { API } from "@/api";
import { AbstractCodeLensProvider } from "@/codeLens/abstractCodeLensProvider";
import { DependencyPosLineType } from "@/schemas";
import { PypiSuggestionProvider } from "@/suggestion/pypi/pypiSuggestionProvider";

export abstract class BasePyPICodeLensProvider extends AbstractCodeLensProvider {
  abstract getDepsPosLines(
    document: vscode.TextDocument,
  ): DependencyPosLineType[];

  public async provideCodeLenses(document: vscode.TextDocument) {
    const depsPosLines = this.getDepsPosLines(document);

    const limit = pLimit(5);
    const input = depsPosLines.map((x) =>
      limit(() => {
        return API.safeGetPypiPackage(x.name);
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
          const range = document.getWordRangeAtPosition(position);

          if (range) {
            const codeLens = new vscode.CodeLens(range);
            const suggestionProvider = new PypiSuggestionProvider(
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
