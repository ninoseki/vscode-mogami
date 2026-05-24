import * as vscode from 'vscode'

import { getDisabledHoverFormats } from '@/configuration'
import { DisableHoverKey, ExtID, projectFormatToSelector } from '@/constants'
import { ExtensionComponent } from '@/extensionComponent'

import { HoverProvider } from './hoverProvider'

export class HoverManager implements ExtensionComponent {
  hoverProviders: HoverProvider[]

  constructor() {
    this.hoverProviders = []
  }

  public activate(context: vscode.ExtensionContext) {
    this.register(context)

    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration(`${ExtID}.${DisableHoverKey}`)) {
          this.register(context)
        }
      }),
    )
  }

  private register(context: vscode.ExtensionContext) {
    this.hoverProviders.forEach((provider) => provider.dispose())
    this.hoverProviders.length = 0

    const disabled = new Set(getDisabledHoverFormats())
    const providers = Array.from(projectFormatToSelector)
      .filter(([projectFormat]) => !disabled.has(projectFormat))
      .map(([projectFormat, selector]) => new HoverProvider(context, selector, projectFormat))

    providers.forEach((provider) => provider.activate(context))
    this.hoverProviders.push(...providers)
  }
}
