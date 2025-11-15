import { Result } from "neverthrow";
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
  pkgResult: Result<PackageType, unknown>;
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

      const result = (() => {
        if (!dependency.specifier) {
          return undefined;
        }
        const index = text.lastIndexOf(dependency.specifier);
        if (index > 0) {
          return new vscode.Range(
            new vscode.Position(lineNumber, index),
            new vscode.Position(
              lineNumber,
              index + dependency.specifier.length,
            ),
          );
        }
      })();

      if (result) {
        return result;
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
  return service.dependencies
    .map(([dependency, range], index) => {
      const pkgResult = results[index];
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
