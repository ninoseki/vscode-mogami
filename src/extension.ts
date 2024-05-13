import * as vscode from "vscode";

import { CodeLensManager } from "@/codeLens/codeLensManager";
import { HoverManager } from "@/hover/hoverManager";

import { OnClearCache } from "./events/onCacheClear";

export function activate(context: vscode.ExtensionContext) {
  const codeLensManager = new CodeLensManager();
  codeLensManager.activate(context);

  const hoverLensManager = new HoverManager();
  hoverLensManager.activate(context);

  new OnClearCache(
    codeLensManager.codeLensProviders,
    hoverLensManager.hoverProviders,
  );
}

export function deactivate() {}
