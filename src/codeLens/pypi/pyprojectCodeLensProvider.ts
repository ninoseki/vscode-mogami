import * as vscode from "vscode";

import { buildDepsRegExp, parse } from "@/format/poetry";
import { DependencyPosLineType } from "@/schemas";

import { BasePyPICodeLensProvider } from "./basePyPICodeLensProvider";

export class PyProjectCodeLensProvider extends BasePyPICodeLensProvider {
  constructor() {
    super({
      pattern: "**/pyproject.toml",
      scheme: "file",
    });
  }

  getDepsPosLines(document: vscode.TextDocument) {
    const depsPosLines: DependencyPosLineType[] = [];
    const depsRegExp = buildDepsRegExp(document.getText());

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const depsPos = parse(line.text, depsRegExp);
      if (!depsPos) {
        continue;
      }
      depsPosLines.push({ ...depsPos, line: line.lineNumber });
    }
    return depsPosLines;
  }
}
