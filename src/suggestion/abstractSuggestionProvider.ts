import * as vscode from "vscode";

export abstract class AbstractSuggestionProvider {
  abstract suggest(): vscode.Command;
}
