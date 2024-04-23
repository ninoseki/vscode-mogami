import { zipWith } from "fp-ts/Array";
import { err, ok } from "neverthrow";
import pLimit from "p-limit";
import * as vscode from "vscode";

import { API } from "@/api";
import { AbstractCodeLensProvider } from "@/codeLens/abstractCodeLensProvider";
import { PypiSuggestionProvider } from "@/suggestion/pypi/pypiSuggestionProvider";
import { PypiDependency } from "@/types";
import { extractDependency } from "@/utils/pypi";
import { getDependenciesFrom } from "@/utils/pyproject";
import { pypiDependencyRegexp } from "@/utils/regexps";

interface Container {
  line: vscode.TextLine;
  deps: PypiDependency;
  match: string;
}

export class PyprojectCodeLensProvider extends AbstractCodeLensProvider {
  constructor() {
    super([
      {
        pattern: "**/pyproject.toml",
        scheme: "file",
      },
    ]);
  }

  public async provideCodeLenses(document: vscode.TextDocument) {
    const lineDeps: Container[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const matches = pypiDependencyRegexp.exec(line.text.trim());
      if (!matches) {
        continue;
      }

      const deps = extractDependency(line.text.trim());
      if (!deps) {
        continue;
      }

      const pyprojectDependencies = getDependenciesFrom(
        document.getText(),
        true,
      );
      const found: boolean =
        pyprojectDependencies.find((d) => d.name === deps.name) !== undefined;

      if (!found) {
        continue;
      }

      lineDeps.push({ line, deps, match: matches[0] });
    }

    const limit = pLimit(5);
    const input = lineDeps.map((x) =>
      limit(() => {
        return API.safeGetPypiPackage(x.deps.name);
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
          const range = document.getWordRangeAtPosition(
            position,
            pypiDependencyRegexp,
          );

          if (range) {
            const codeLens = new vscode.CodeLens(range);
            const suggestionProvider = new PypiSuggestionProvider(deps, gem);
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
