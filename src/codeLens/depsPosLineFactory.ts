import * as vscode from "vscode";

import { DependencyPosLineType, DependencyPosType } from "@/schemas";

export function createDepsPosLines({
  document,
  parseFn,
}: {
  document: vscode.TextDocument;
  parseFn: (line: string) => DependencyPosType | undefined;
}) {
  return Array.from(Array(document.lineCount).keys())
    .map((line): DependencyPosLineType | undefined => {
      const docLine = document.lineAt(line);
      const depsPos = parseFn(docLine.text);
      if (!depsPos) {
        return undefined;
      }
      return { ...depsPos, line };
    })
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);
}
