import * as vscode from "vscode";

import { API } from "@/api";
import { AbstractCodeLensProvider } from "@/codeLens/abstractCodeLensProvider";
import { PypiSuggestionProvider } from "@/suggestion/pypi/pypiSuggestionProvider";
import { extractDependency } from "@/utils/pypi";
import { pypiDependencyRegexp } from "@/utils/regexps";

export class RequirementsCodeLensProvider extends AbstractCodeLensProvider {
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

  public async provideCodeLenses(document: vscode.TextDocument) {
    const codeLenses: vscode.CodeLens[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const matches = pypiDependencyRegexp.exec(line.text.trim());
      if (!matches) {
        continue;
      }

      const dependency = extractDependency(line.text.trim());
      if (!dependency) {
        continue;
      }

      try {
        const pkg = await API.getPypiPackage(dependency.name);
        const indexOf = line.text.indexOf(matches[0]);
        const position = new vscode.Position(line.lineNumber, indexOf);
        const range = document.getWordRangeAtPosition(
          position,
          pypiDependencyRegexp,
        );

        if (range) {
          const codeLens = new vscode.CodeLens(range);
          const suggestionProvider = new PypiSuggestionProvider(
            dependency,
            pkg,
          );
          codeLens.command = suggestionProvider.suggest();
          codeLenses.push(codeLens);
        }
      } catch (_) {
        continue;
      }
    }

    return codeLenses;
  }
}
