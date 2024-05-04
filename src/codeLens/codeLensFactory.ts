import { zipWith } from "fp-ts/lib/Array";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as vscode from "vscode";

import { DependencyType, PackageType } from "@/schemas";

import { createDependencyPositions } from "./dependencyPositionFactory";
import { OnUpdateDependencyClickCommand } from "./onUpdateDependencyClick";
import { getPackages } from "./packageFactory";
import { SuggestionCodeLens } from "./suggesntinCodeLens";

export function createCodeLens({
  document,
  pkg,
  dependency,
  position,
  satisfies,
}: {
  document: vscode.TextDocument;
  pkg: PackageType;
  dependency: DependencyType;
  position: vscode.Position;
  satisfies: (version: string, specifier?: string) => boolean;
}): E.Either<Error, SuggestionCodeLens> {
  const docLine = document.lineAt(position.line);
  const range = document.getWordRangeAtPosition(position);
  if (!range) {
    return E.left(new Error("range not found"));
  }

  const replaceRange: vscode.Range | undefined = (() => {
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
  const isSatisfied = satisfies(pkg.version, dependency.specifier);
  const direction = isSatisfied ? "" : "↑ ";
  const title = `${direction}latest: ${pkg.version}`;
  const command = isSatisfied ? "" : OnUpdateDependencyClickCommand;
  codeLens.setCommand(title, command, [codeLens]);
  return E.right(codeLens);
}

export async function createCodeLenses({
  document,
  satisfies,
  parse,
  getPackage,
}: {
  document: vscode.TextDocument;
  satisfies: (version: string, specifier?: string) => boolean;
  parse: (line: string) => DependencyType | undefined;
  getPackage: (name: string) => Promise<PackageType>;
}) {
  const dependencyPositions = createDependencyPositions({
    document,
    parse: parse,
  });
  const names = dependencyPositions.map((x) => x.dependency.name);
  const results = await getPackages({ names, fn: getPackage });
  return zipWith(dependencyPositions, results, (dependencyPosition, result) => {
    return { dependencyPosition, result };
  })
    .map((item) => {
      if (E.isLeft(item.result)) {
        return undefined;
      }
      const { dependency, position } = item.dependencyPosition;
      const pkg = item.result.right;
      return pipe(
        createCodeLens({
          document,
          pkg,
          dependency,
          position,
          satisfies,
        }),
        E.getOrElseW(() => undefined),
      );
    })
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);
}
