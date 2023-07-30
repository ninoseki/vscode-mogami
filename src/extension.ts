import * as vscode from "vscode";

import { CodeLensManager } from "@/codeLens/codeLensManager";
import { HoverManager } from "@/hover/hoverManager";

export function activate(context: vscode.ExtensionContext) {
  new CodeLensManager().activate(context);
  new HoverManager().activate(context);
}

export function deactivate() {}
