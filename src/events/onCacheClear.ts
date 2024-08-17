import * as vscode from "vscode";

import { AbstractCodeLensProvider } from "@/codeLens/abstractCodeLensProvider";
import { OnClearCacheCommand } from "@/constants";
import { AbstractHoverProvider } from "@/hover/abstractHoverProvider";
import { clearCache } from "@/package/cache";

export class OnClearCache {
  disposable: vscode.Disposable;

  codeLensProviders: AbstractCodeLensProvider[];
  hoverProviders: AbstractHoverProvider[];

  constructor(
    codeLensProviders: AbstractCodeLensProvider[],
    hoverProviders: AbstractHoverProvider[],
  ) {
    this.codeLensProviders = codeLensProviders;
    this.hoverProviders = hoverProviders;

    this.disposable = vscode.commands.registerCommand(
      OnClearCacheCommand,

      this.execute,
      this,
    );
  }

  execute(): void {
    clearCache();

    this.codeLensProviders.forEach((provider) => {
      if (provider.isActive()) {
        provider.reloadCodeLenses();
      }
    });
  }

  dispose() {
    this.disposable.dispose();
  }
}
