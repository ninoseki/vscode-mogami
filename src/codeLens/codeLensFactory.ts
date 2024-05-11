import { isAxiosError } from "axios";
import { zipWith } from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import semver from "semver";
import * as vscode from "vscode";

import { OnUpdateDependencyClickCommand } from "@/constants";
import { DependencyPositionType, DependencyType, PackageType } from "@/schemas";
import { eq, maxSatisfying } from "@/versioning/utils";

import { getPackages } from "./packageFactory";
import { SuggestionCodeLens } from "./suggesntinCodeLens";

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
  pkg,
  dependency,
  position,
  suggestion,
}: {
  document: vscode.TextDocument;
  pkg: E.Either<unknown, PackageType>;
  dependency: DependencyType;
  position: vscode.Position;
  suggestion: PackageSuggestion;
  replaceable?: boolean;
}): SuggestionCodeLens | undefined {
  const docLine = document.lineAt(position.line);
  const range = document.getWordRangeAtPosition(position);
  if (!range) {
    return undefined;
  }

  const replaceRange: vscode.Range | undefined = (() => {
    if (!suggestion.replaceable) {
      return undefined;
    }
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
    pkg,
    dependency,
    documentUrl: vscode.Uri.file(document.fileName),
  });
  const { title, command } = suggestion;
  codeLens.setCommand(title, command, [codeLens]);
  return codeLens;
}

export async function createCodeLenses({
  document,
  satisfies,
  getPackage,
  dependencyPositions,
  concurrency,
}: {
  document: vscode.TextDocument;
  concurrency?: number;
  dependencyPositions: DependencyPositionType[];
  satisfies: (version: string, specifier?: string) => boolean;
  getPackage: (name: string) => Promise<PackageType>;
}): Promise<SuggestionCodeLens[]> {
  const names = dependencyPositions.map((x) => x.dependency.name);
  const results = await getPackages({ names, getPackage, concurrency });
  return zipWith(dependencyPositions, results, (dependencyPosition, pkg) => {
    return { dependencyPosition, pkg };
  })
    .flatMap((item) => {
      const { dependency, position } = item.dependencyPosition;
      const suggestions: PackageSuggestion[] = [];

      if (E.isLeft(item.pkg)) {
        suggestions.push(createErrorSuggestion(item.pkg.left));
      } else {
        const pkg = item.pkg.right;
        const isLatest = eq(pkg.version, dependency.specifier);
        const isFixedVersion = semver.valid(dependency.specifier);
        const isRangeVersion = semver.validRange(pkg.version);
        const satisfiesVersion = maxSatisfying({
          pkg,
          specifier: dependency.specifier,
          satisfies,
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
          pkg: item.pkg,
          dependency,
          position,
          suggestion,
        }),
      );
    })
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);
}
