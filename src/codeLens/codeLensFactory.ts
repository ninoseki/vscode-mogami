import { zipWith } from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as vscode from "vscode";

import { ProjectService } from "@/project";
import type { DependencyType, PackageType } from "@/schemas";

import { SuggestionCodeLens } from "./suggestionCodeLens";
import { createPackageSuggestions, type PackageSuggestion } from "./utils";

function createCodeLens({
  document,
  pkgResult,
  dependency,
  range,
  suggestion,
}: {
  document: vscode.TextDocument;
  pkgResult: E.Either<unknown, PackageType>;
  dependency: DependencyType;
  range: vscode.Range;
  suggestion: PackageSuggestion;
}): SuggestionCodeLens | undefined {
  const replaceRange: vscode.Range | undefined = (() => {
    if (!suggestion.replaceable) {
      return undefined;
    }

    // check from end to start
    for (let i = range.end.line - range.start.line; i >= 0; i--) {
      const lineNumber = range.start.line + i;
      const text = document.lineAt(lineNumber).text;
      const result = pipe(
        O.fromNullable(dependency.specifier),
        O.flatMap((s: string) => {
          const index = text.lastIndexOf(s);
          if (index > 0) {
            return O.some(
              new vscode.Range(
                new vscode.Position(lineNumber, index),
                new vscode.Position(lineNumber, index + s.length),
              ),
            );
          }
          return O.none;
        }),
      );
      if (O.isSome(result)) {
        return result.value;
      }
    }
    return undefined;
  })();

  const codeLens = new SuggestionCodeLens(range, {
    replaceRange,
    pkgResult,
    dependency,
    documentUrl: vscode.Uri.file(document.fileName),
  });
  const { title, command } = suggestion;
  codeLens.setCommand(title, command, [codeLens]);
  return codeLens;
}

export async function createCodeLenses(
  document: vscode.TextDocument,
  service: ProjectService,
  { concurrency }: { concurrency: number },
): Promise<SuggestionCodeLens[]> {
  // get packages in bulk and create code lenses based on the results
  const results = await service.getAllPackageResults({ concurrency });
  return zipWith(service.dependencies, results, (item, pkgResult) => {
    const dependency = item[0];
    const range = item[1];
    return { dependency, range, pkgResult };
  })
    .flatMap((item) => {
      const { dependency, range, pkgResult } = item;

      const suggestionMapper = (suggestion: PackageSuggestion) => {
        return createCodeLens({
          document,
          pkgResult,
          dependency,
          range,
          suggestion,
        });
      };

      const { satisfies, validateRange } = service;
      const suggestions = createPackageSuggestions({
        dependency,
        pkgResult,
        satisfies,
        validateRange,
      });
      return suggestions.map(suggestionMapper);
    })
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);
}
