import * as vscode from "vscode";

import {
  ConcurrencyKey,
  EnableCodeLensKey,
  ExtID,
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
