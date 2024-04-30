import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import { err, ok, Result } from "neverthrow";
import * as vscode from "vscode";

import { DependencyType, PackageType } from "@/schemas";

import { OnUpdateDependencyClickCommand } from "./onUpdateDependencyClick";
import { SuggestionCodeLens } from "./suggesntinCodeLens";

export function createCodeLens({
  document,
  pkg,
  deps,
  line,
  pos,
  satisfies,
}: {
  document: vscode.TextDocument;
  pkg: PackageType;
  deps: DependencyType;
  line: number;
  pos: number;
  satisfies: (version: string, specifier?: string) => boolean;
}): Result<SuggestionCodeLens, unknown> {
  const docLine = document.lineAt(line);
  const position = new vscode.Position(line, pos);
  const range = document.getWordRangeAtPosition(position);
  if (!range) {
    return err("range not found");
  }

  const replaceRange: vscode.Range | undefined = (() => {
    return pipe(
      O.fromNullable(deps.specifier),
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
    deps,
    documentUrl: vscode.Uri.file(document.fileName),
  });
  const isSatisfied = satisfies(pkg.version, deps.specifier);
  const direction = isSatisfied ? "" : "↑ ";
  const title = `${direction}latest: ${pkg.version}`;
  const command = isSatisfied ? "" : OnUpdateDependencyClickCommand;
  codeLens.setCommand(title, command, [codeLens]);
  return ok(codeLens);
}
