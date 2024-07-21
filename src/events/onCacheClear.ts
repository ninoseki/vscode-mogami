import * as vscode from "vscode";

import { AbstractCodeLensProvider } from "@/codeLens/abstractCodeLensProvider";
import { OnClearCacheCommand } from "@/constants";
import { AbstractHoverProvider } from "@/hover/abstractHoverProvider";
import { clearStorage } from "@/package/storage";

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
      //  eslint-disable-next-line @typescript-eslint/unbound-method
      this.execute,
      this,
    );
  }

  execute(): void {
    clearStorage();

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
