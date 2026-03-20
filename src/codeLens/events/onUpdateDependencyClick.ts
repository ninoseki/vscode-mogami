import * as vscode from 'vscode'

import { SuggestionCodeLens } from '@/codeLens/suggestionCodeLens'
import { OnUpdateDependencyClickCommand } from '@/constants'
import { formatWithExistingLeading } from '@/versioning/utils'

export class OnUpdateDependencyClick {
  disposable: vscode.Disposable

  constructor() {
    this.disposable = vscode.commands.registerCommand(
      OnUpdateDependencyClickCommand,
      this.execute,
      this,
    )
  }

  async execute(codeLens: SuggestionCodeLens): Promise<void> {
    if (!codeLens.replaceRange || !codeLens.dependency.specifier || codeLens.pkgResult.isErr()) {
      return
    }

    const pkg = codeLens.pkgResult.value
    const edit = new vscode.WorkspaceEdit()

    if (pkg.format === 'github-actions-workflow' && pkg.alias) {
      // GitHub Actions: replace specifier (and any existing comment) with SHA256 alias and tag as comment
      const document = await vscode.workspace.openTextDocument(codeLens.documentUrl)
      const lineText = document.lineAt(codeLens.replaceRange.start.line).text
      const lineEnd = lineText.trimEnd().length
      const extendedRange = new vscode.Range(
        codeLens.replaceRange.start,
        new vscode.Position(codeLens.replaceRange.start.line, lineEnd),
      )
      edit.replace(codeLens.documentUrl, extendedRange, `${pkg.alias} # ${pkg.version}`)
    } else {
      edit.replace(
        codeLens.documentUrl,
        codeLens.replaceRange,
        formatWithExistingLeading(codeLens.dependency.specifier, pkg.version),
      )
    }

    await vscode.workspace.applyEdit(edit)
  }

  async dispose() {
    await this.disposable.dispose()
  }
}
