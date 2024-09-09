import * as E from "fp-ts/lib/Either";
import * as vscode from "vscode";

import { SuggestionCodeLens } from "@/codeLens/suggestionCodeLens";
import { OnUpdateDependencyClickCommand } from "@/constants";
import { formatWithExistingLeading } from "@/versioning/utils";

export class OnUpdateDependencyClick {
  disposable: vscode.Disposable;

  constructor() {
    this.disposable = vscode.commands.registerCommand(
      OnUpdateDependencyClickCommand,
      this.execute,
      this,
    );
  }

  async execute(codeLens: SuggestionCodeLens): Promise<void> {
    if (
      !codeLens.replaceRange ||
      !codeLens.dependency.specifier ||
      E.isLeft(codeLens.pkg)
    ) {
      return;
    }

    const pkg = codeLens.pkg.right;
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      codeLens.documentUrl,
      codeLens.replaceRange,
      formatWithExistingLeading(codeLens.dependency.specifier, pkg.version),
    );
    await vscode.workspace.applyEdit(edit);
  }

  async dispose() {
    await this.disposable.dispose();
  }
}
