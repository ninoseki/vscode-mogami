import * as vscode from 'vscode'

import { getConcurrency, getDisabledCodeLensFormats, getEnableCodeLens } from '@/configuration'
import { DisableCodeLensKey, ExtID, projectFormatToSelector } from '@/constants'
import { ExtensionComponent } from '@/extensionComponent'

import { CodeLensProvider } from './codeLensProvider'
import { CodeLensState } from './codeLensState'
import { OnActiveTextEditorChange } from './events/onActiveTextEditorChange'
import { OnBumpDependencyClick } from './events/onBumpDependencyClick'
import { OnHideClick } from './events/onHideClick'
import { OnShowClick } from './events/onShowClick'
import { OnShowingProgress } from './events/onShowingProgress'
import { OnUpdateDependencyClick } from './events/onUpdateDependencyClick'

export class CodeLensManager implements ExtensionComponent {
  codeLensProviders: CodeLensProvider[]

  constructor() {
    this.codeLensProviders = []
  }

  public async activate(context: vscode.ExtensionContext) {
    const enableCodeLens = getEnableCodeLens()

    if (!enableCodeLens) {
      return
    }

    const state = new CodeLensState()
    await state.applyDefaults()

    const concurrency = getConcurrency()
    this.register(context, concurrency, state)

    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(`${ExtID}.${DisableCodeLensKey}`)) {
          this.register(context, concurrency, state)
        }
      }),
    )

    new OnShowingProgress()
    new OnShowClick(this.codeLensProviders, state)
    new OnHideClick(this.codeLensProviders, state)
    new OnActiveTextEditorChange(this.codeLensProviders, state)
    new OnUpdateDependencyClick()
    new OnBumpDependencyClick()
  }

  private register(context: vscode.ExtensionContext, concurrency: number, state: CodeLensState) {
    this.codeLensProviders.forEach((provider) => provider.dispose())
    this.codeLensProviders.length = 0

    const disabled = new Set(getDisabledCodeLensFormats())
    const providers = Array.from(projectFormatToSelector)
      .filter(([projectFormat]) => !disabled.has(projectFormat))
      .map(([projectFormat, selector]) => {
        const name = `${projectFormat}-CodeLensProvider`
        return new CodeLensProvider(context, selector, projectFormat, concurrency, state, name)
      })

    providers.forEach((provider) => provider.activate(context))
    this.codeLensProviders.push(...providers)
  }
}
