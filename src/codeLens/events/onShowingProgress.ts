import * as vscode from 'vscode'

import { OnShowingProgressCommand } from '@/constants'

export class OnShowingProgress {
  disposable: vscode.Disposable

  constructor() {
    this.disposable = vscode.commands.registerCommand(OnShowingProgressCommand, () => {})
  }

  dispose() {
    this.disposable.dispose()
  }
}
