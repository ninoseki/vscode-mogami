import * as vscode from "vscode";

import { CodeLensProvider } from "@/codeLens/codeLensProvider";
import { OnClearCacheCommand } from "@/constants";
import { HoverProvider } from "@/hover/hoverProvider";
import { clearCache } from "@/package/cache";

export class OnClearCache {
  disposable: vscode.Disposable;

  codeLensProviders: CodeLensProvider[];
  hoverProviders: HoverProvider[];

  constructor(
    codeLensProviders: CodeLensProvider[],
    hoverProviders: HoverProvider[],
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
