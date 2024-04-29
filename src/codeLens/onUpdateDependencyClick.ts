import * as vscode from "vscode";

import { formatWithExistingLeading } from "@/versioning/utils";

import { SuggestionCodeLens } from "./suggesntinCodeLens";

export const OnUpdateDependencyClickCommand =
  "mogami.suggestions.updateDependencyClick";

export class OnUpdateDependencyClick {
  disposable: vscode.Disposable;

  constructor() {
    this.disposable = vscode.commands.registerCommand(
      OnUpdateDependencyClickCommand,
      // eslint-disable-next-line @typescript-eslint/unbound-method
      this.execute,
      this,
    );
  }

  async execute(codeLens: SuggestionCodeLens): Promise<void> {
    if (!codeLens.replaceRange || !codeLens.deps.specifier) {
      return;
    }

    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      codeLens.documentUrl,
      codeLens.replaceRange,
      formatWithExistingLeading(codeLens.deps.specifier, codeLens.pkg.version),
    );
    await vscode.workspace.applyEdit(edit);
  }

  async dispose() {
    await this.disposable.dispose();
  }
}
