import * as vscode from "vscode";

import {
  ConcurrencyKey,
  EnableCodeLensKey,
  ExtID,
  gitHubPersonalAccessToken,
  showPrerelease,
  usePrivateSourceKey,
} from "@/constants";

export function getEnableCodeLens() {
  return vscode.workspace.getConfiguration(ExtID).get(EnableCodeLensKey, true);
}

export function getConcurrency() {
  return vscode.workspace.getConfiguration(ExtID).get(ConcurrencyKey, 5);
}

export function getUsePrivateSource() {
  return vscode.workspace
    .getConfiguration(ExtID)
    .get(usePrivateSourceKey, true);
}

export function getShowPrerelease() {
  return vscode.workspace.getConfiguration(ExtID).get(showPrerelease, false);
}

export function getGitHubPersonalAccessToken(): string | null {
  return vscode.workspace
    .getConfiguration(ExtID)
    .get(gitHubPersonalAccessToken, null);
}
