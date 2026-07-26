import * as vscode from 'vscode'

import { CodeLensProvider } from '@/codeLens/codeLensProvider'

const DEBOUNCE_MS = 500

export class OnTextDocumentChange {
  disposable: vscode.Disposable
  codeLensProviders: CodeLensProvider[]
  private timeout: ReturnType<typeof setTimeout> | undefined

  constructor(codeLensProviders: CodeLensProvider[]) {
    this.codeLensProviders = codeLensProviders
    this.disposable = vscode.workspace.onDidChangeTextDocument(this.execute, this)
  }

  execute(e: vscode.TextDocumentChangeEvent): void {
    // ignore non-file documents and empty change events
    if (e.document.uri.scheme !== 'file' || e.contentChanges.length === 0) {
      return
    }

    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    this.timeout = setTimeout(() => {
      this.codeLensProviders.forEach((provider) => provider.reloadCodeLenses())
    }, DEBOUNCE_MS)
  }

  dispose() {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    this.disposable.dispose()
  }
}
