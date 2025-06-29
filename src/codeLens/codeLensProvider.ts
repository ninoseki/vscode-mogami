import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { tryCatch } from "fp-ts/lib/TaskEither";
import * as vscode from "vscode";

import { ExtensionComponent } from "@/extensionComponent";
import { ProjectParser } from "@/project";
import { ProjectFormatType } from "@/schemas";

import { createCodeLenses } from "./codeLensFactory";
import { CodeLensState } from "./codeLensState";

export class CodeLensProvider
  implements vscode.CodeLensProvider, ExtensionComponent
{
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  private projectParser: ProjectParser | undefined;

  constructor(
    private context: vscode.ExtensionContext,
    private documentSelector: vscode.DocumentSelector,
    private projectFormat: ProjectFormatType,
    private concurrency: number,
    private state: CodeLensState,
    public name?: string,
  ) {
    vscode.workspace.onDidChangeConfiguration(() => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  reloadCodeLenses() {
    // notify vscode to refresh code lenses
    this._onDidChangeCodeLenses.fire();
  }

  private async getProjectParser(): Promise<ProjectParser> {
    if (this.projectParser) {
      return this.projectParser;
    }
    this.projectParser = new ProjectParser(this.context, this.projectFormat);
    return this.projectParser;
  }

  public async provideCodeLenses(document: vscode.TextDocument) {
    await this.state.setProviderActive(this.name);

    if (!this.state.show.value) {
      return [];
    }

    const projectParser = await this.getProjectParser();
    const task = tryCatch(
      () => {
        const service = projectParser.parse(document);
        return createCodeLenses(document, service, {
          concurrency: this.concurrency,
        });
      },
      (e: unknown) => e,
    );
    const result = await task();

    await this.state.clearProviderBusy();

    return pipe(
      result,
      E.getOrElseW(() => []),
    );
  }

  public isActive(): boolean {
    return this.state.providerActive.value === this.name;
  }

  public activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(this.documentSelector, this),
    );
  }
}
