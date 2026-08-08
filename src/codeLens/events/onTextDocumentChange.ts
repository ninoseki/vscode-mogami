import * as vscode from 'vscode'

import { CodeLensProvider } from '@/codeLens/codeLensProvider'

const DEBOUNCE_MS = 500

export class OnTextDocumentChange {
  disposable: vscode.Disposable
  codeLensProviders: CodeLensProvider[]
  private timeouts: Map<string, ReturnType<typeof setTimeout>> = new Map()

  constructor(codeLensProviders: CodeLensProvider[]) {
    this.codeLensProviders = codeLensProviders
    this.disposable = vscode.workspace.onDidChangeTextDocument(this.execute, this)
  }

  execute(e: vscode.TextDocumentChangeEvent): void {
    // ignore non-file documents and empty change events
    if (e.document.uri.scheme !== 'file' || e.contentChanges.length === 0) {
      return
    }

    // don't reload code lenses if the document doesn't match any of the registered providers
    if (!this.codeLensProviders.some((provider) => provider.matches(e.document))) {
      return
    }

    const key = e.document.uri.toString(true)
    this.clearTimeout(key)
    this.timeouts.set(
      key,
      setTimeout(() => {
        this.timeouts.delete(key)
        // NOTE: resolve the providers here, they may have been re-registered
        this.codeLensProviders
          .filter((provider) => provider.matches(e.document))
          .forEach((provider) => provider.reloadCodeLenses())
      }, DEBOUNCE_MS),
    )
  }

  private clearTimeout(key: string): void {
    const pending = this.timeouts.get(key)
    if (pending) {
      clearTimeout(pending)
      this.timeouts.delete(key)
    }
  }

  dispose() {
    this.timeouts.forEach((timeout) => clearTimeout(timeout))
    this.timeouts.clear()
    this.disposable.dispose()
  }
}
