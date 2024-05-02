import * as vscode from "vscode";

import { DependencyPositionType, DependencyType } from "@/schemas";

export function createDependencyPositions({
  document,
  parse,
}: {
  document: vscode.TextDocument;
  parse: (line: string) => DependencyType | undefined;
}): DependencyPositionType[] {
  return Array.from(Array(document.lineCount).keys())
    .map((line): DependencyPositionType | undefined => {
      const docLine = document.lineAt(line);
      const dependency = parse(docLine.text);
      if (!dependency) {
        return undefined;
      }

      const character = docLine.text.indexOf(dependency.name);
      const position = new vscode.Position(line, character);

      return { dependency, position };
    })
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);
}
