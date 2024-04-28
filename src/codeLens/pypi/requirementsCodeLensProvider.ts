import * as vscode from "vscode";

import { parse } from "@/format/pip";
import { DependencyPosLineType } from "@/schemas";

import { BasePyPICodeLensProvider } from "./basePyPICodeLensProvider";

export class RequirementsCodeLensProvider extends BasePyPICodeLensProvider {
  constructor() {
    const patterns = [
      "**/*-requirements.txt",
      "**/*.requirements.txt",
      "**/requirements-*.txt",
      "**/requirements.txt",
      "**/requirements/*.txt",
    ];

    super(
      patterns.map((pattern) => {
        return { pattern, scheme: "file" };
      }),
    );
  }

  public getDepsPosLines(document: vscode.TextDocument) {
    const depsPosLines: DependencyPosLineType[] = [];
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const depsPos = parse(line.text);
      if (!depsPos) {
        continue;
      }
      depsPosLines.push({ ...depsPos, line: line.lineNumber });
    }
    return depsPosLines;
  }
}
