import semver from 'semver'
import * as vscode from 'vscode'

import { SuggestionCodeLens } from '@/codeLens/suggestionCodeLens'
import { OnBumpDependencyClickCommand } from '@/constants'
import { formatWithExistingLeading } from '@/versioning/utils'

export class OnBumpDependencyClick {
  disposable: vscode.Disposable

  constructor() {
    this.disposable = vscode.commands.registerCommand(
      OnBumpDependencyClickCommand,
      this.execute,
      this,
    )
  }

  async execute(codeLens: SuggestionCodeLens): Promise<void> {
    if (!codeLens.replaceRange || !codeLens.dependency.specifier || codeLens.pkgResult.isErr()) {
      return
    }

    const pkg = codeLens.pkgResult.value
    const bumpVersion = semver.maxSatisfying(pkg.versions, codeLens.dependency.specifier)
    if (!bumpVersion) {
      return
    }

    const edit = new vscode.WorkspaceEdit()
    edit.replace(
      codeLens.documentUrl,
      codeLens.replaceRange,
      formatWithExistingLeading(codeLens.dependency.specifier, bumpVersion),
    )
    await vscode.workspace.applyEdit(edit)
  }

  async dispose() {
    await this.disposable.dispose()
  }
}
