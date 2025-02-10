import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { tryCatch } from "fp-ts/lib/TaskEither";
import * as vscode from "vscode";

import { ExtensionComponent } from "@/extensionComponent";
import { ProjectParser } from "@/project";

import { createCodeLenses } from "./codeLensFactory";
import { CodeLensState } from "./codeLensState";

export class CodeLensProvider
  implements vscode.CodeLensProvider, ExtensionComponent
{
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor(
    private documentSelector: vscode.DocumentSelector,
    private projectParser: ProjectParser,
    private concurrency: number,
    private state: CodeLensState,
    public name?: string,
  ) {
    this.documentSelector = documentSelector;
    this.projectParser = projectParser;
    this.concurrency = concurrency;
    this.state = state;
    this.name = name;

    vscode.workspace.onDidChangeConfiguration(() => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  reloadCodeLenses() {
    // notify vscode to refresh code lenses
    this._onDidChangeCodeLenses.fire();
  }

  public async provideCodeLenses(document: vscode.TextDocument) {
    await this.state.setProviderActive(this.name);

    if (!this.state.show.value) {
      return [];
    }

    const task = tryCatch(
      () => {
        const service = this.projectParser.parse(document);
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
