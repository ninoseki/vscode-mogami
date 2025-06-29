import * as vscode from "vscode";

import { CodeLensManager } from "@/codeLens/codeLensManager";
import { HoverManager } from "@/hover/hoverManager";

import { OnClearCache } from "./events/onCacheClear";
import { registerDeleteTokenCommand, registerSetTokenCommand } from "./secrets";

export async function activate(context: vscode.ExtensionContext) {
  const codeLensManager = new CodeLensManager();
  await codeLensManager.activate(context);

  const hoverLensManager = new HoverManager();
  hoverLensManager.activate(context);

  new OnClearCache(
    codeLensManager.codeLensProviders,
    hoverLensManager.hoverProviders,
  );

  registerSetTokenCommand(context);
  registerDeleteTokenCommand(context);
}

export function deactivate() {}
