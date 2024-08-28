import * as vscode from "vscode";

import { DependencyPositionType, ParseFnType } from "@/schemas";

export function createDependencyPositions(
  document: vscode.TextDocument,
  { parse }: { parse: ParseFnType },
): DependencyPositionType[] {
  return Array.from(Array(document.lineCount).keys())
    .map((line): DependencyPositionType | undefined => {
      const docLine = document.lineAt(line);
      const dependency = parse(docLine.text);
      if (!dependency) {
        return undefined;
      }

      const character = docLine.text.indexOf(dependency.name);
      if (character < 0) {
        return undefined;
      }

      const position = new vscode.Position(line, character);

      return { dependency, position };
    })
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);
}
