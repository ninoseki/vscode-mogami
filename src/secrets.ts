import * as vscode from "vscode";

import { ExtID, GitHubPersonalAccessTokenKey } from "@/constants";

export function registerSetTokenCommand(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    `${ExtID}.setGitHubPersonalAccessToken`,
    async () => {
      const tokenInput = await vscode.window.showInputBox({
        title: "Set GitHub Personal Access Token",
        prompt: "Enter your GitHub Personal Access Token",
        password: true,
      });
      context.secrets.store(GitHubPersonalAccessTokenKey, tokenInput ?? "");
      if (tokenInput) {
        vscode.window.showInformationMessage(
          "GitHub Personal Access Token has been set successfully.",
        );
      } else {
        vscode.window.showWarningMessage(
          "GitHub Personal Access Token was not set. Please try again.",
        );
      }
    },
  );
  context.subscriptions.push(command);
}

export function registerDeleteTokenCommand(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand(
    `${ExtID}.deleteGitHubPersonalAccessToken`,
    async () => {
      await context.secrets.delete(GitHubPersonalAccessTokenKey);
      vscode.window.showInformationMessage(
        "GitHub Personal Access Token has been deleted successfully.",
      );
    },
  );
  context.subscriptions.push(command);
}

export async function getGitHubPersonalAccessToken(
  context: vscode.ExtensionContext,
) {
  return await context.secrets.get(GitHubPersonalAccessTokenKey);
}
