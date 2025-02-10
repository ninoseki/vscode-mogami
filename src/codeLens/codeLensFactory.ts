import { isAxiosError } from "axios";
import { zipWith } from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import semver from "semver";
import * as vscode from "vscode";

import { OnUpdateDependencyClickCommand } from "@/constants";
import { ProjectService } from "@/project";
import type { DependencyType, PackageType } from "@/schemas";
import { eq, maxSatisfying } from "@/versioning/utils";

import { SuggestionCodeLens } from "./suggestionCodeLens";

export interface PackageSuggestion {
  title: string;
  command: string;
  replaceable?: boolean;
}

function createErrorSuggestion(err: unknown): PackageSuggestion {
  const symbol = "🔴";
  const message: string = (() => {
    if (isAxiosError(err)) {
      switch (err.response?.status) {
        case 400:
          return `400 bad request`;
        case 401:
          return `401 not authorized`;
        case 403:
          return `403 forbidden`;
        case 404:
          return `package not found`;
        case 500:
          return `internal server error`;
      }
    }
    return `something went wrong`;
  })();
  return {
    title: `${symbol} ${message}`,
    command: "",
  };
}

function createFixedSuggestion(dependency: DependencyType): PackageSuggestion {
  return { title: `🟡 fixed ${dependency.specifier}`, command: "" };
}

function createLatestSuggestion(pkg: PackageType): PackageSuggestion {
  return { title: `🟢 latest ${pkg.version}`, command: "" };
}

function createLatestSatisfiesSuggestion(pkg: PackageType): PackageSuggestion {
  return { title: `🟡 satisfies latest ${pkg.version}`, command: "" };
}

function createSatisfiesSuggestion(
  satisfiesVersion: string,
): PackageSuggestion {
  return { title: `🟡 satisfies ${satisfiesVersion}`, command: "" };
}

function createUpdatableSuggestion(pkg: PackageType): PackageSuggestion {
  const title = `↑ latest ${pkg.version}`;
  return { title, command: OnUpdateDependencyClickCommand, replaceable: true };
}

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
  replaceable?: boolean;
}): SuggestionCodeLens | undefined {
  const replaceRange: vscode.Range | undefined = (() => {
    if (!suggestion.replaceable) {
      return undefined;
    }
    const docLine = document.lineAt(range.start.line);
    return pipe(
      O.fromNullable(dependency.specifier),
      O.flatMap((s: string) => {
        const index = docLine.text.lastIndexOf(s);
        if (index > 0) {
          return O.some(
            new vscode.Range(
              new vscode.Position(docLine.lineNumber, index),
              new vscode.Position(docLine.lineNumber, index + s.length),
            ),
          );
        }
        return O.none;
      }),
      O.getOrElseW(() => undefined),
    );
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
      const suggestions: PackageSuggestion[] = [];

      if (E.isLeft(pkgResult)) {
        suggestions.push(createErrorSuggestion(pkgResult.left));
      } else {
        const pkg = pkgResult.right;
        const isLatest =
          eq(pkg.version, dependency.specifier) || !dependency.specifier;
        const isFixedVersion = semver.valid(dependency.specifier);
        const isRangeVersion = semver.validRange(pkg.version);
        const satisfiesVersion = maxSatisfying({
          pkg,
          specifier: dependency.specifier,
          satisfies: service.satisfies,
        });

        if (isLatest) {
          suggestions.push(createLatestSuggestion(pkg));
        } else if (isFixedVersion) {
          suggestions.push(createFixedSuggestion(dependency));
        } else if (isRangeVersion && satisfiesVersion) {
          if (satisfiesVersion === pkg.version) {
            suggestions.push(createLatestSatisfiesSuggestion(pkg));
          } else {
            suggestions.push(createSatisfiesSuggestion(satisfiesVersion));
          }
        }

        if (!isLatest) {
          suggestions.push(createUpdatableSuggestion(pkg));
        }
      }

      return suggestions.map((suggestion) =>
        createCodeLens({
          document,
          pkgResult,
          dependency,
          range,
          suggestion,
        }),
      );
    })
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);
}
