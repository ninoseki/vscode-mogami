import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { tryCatch } from "fp-ts/lib/TaskEither";
import * as vscode from "vscode";

import { ExtensionComponent } from "@/extensionComponent";
import {
  DependencyPositionType,
  PackageClientType,
  SatisfiesFnType,
} from "@/schemas";

import { createCodeLenses } from "./codeLensFactory";
import { CodeLensState } from "./codeLensState";

export abstract class AbstractCodeLensProvider
  implements vscode.CodeLensProvider, ExtensionComponent
{
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  private satisfies: SatisfiesFnType;
  private state: CodeLensState;
  abstract client: PackageClientType;

  name?: string;

  constructor(
    private documentSelector: vscode.DocumentSelector,
    {
      state,
      satisfies,
    }: {
      state: CodeLensState;
      satisfies: SatisfiesFnType;
    },
  ) {
    this.documentSelector = documentSelector;

    this.state = state;
    this.satisfies = satisfies;

    vscode.workspace.onDidChangeConfiguration(() => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  isActive(): boolean {
    return this.state.providerActive.value === this.name;
  }

  reloadCodeLenses() {
    // notify vscode to refresh code lenses
    this._onDidChangeCodeLenses.fire();
  }

  public async provideCodeLenses(document: vscode.TextDocument) {
    if (!this.state.show.value) {
      return [];
    }

    await this.state.setProviderActive(this.name);
    await this.state.setProviderBusy();

    const task = tryCatch(
      () => {
        const dependencyPositions = this.parseDocuments(document);
        return createCodeLenses({
          document,
          dependencyPositions,
          satisfies: this.satisfies,
          client: this.client,
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

  public abstract parseDocuments(
    document: vscode.TextDocument,
  ): DependencyPositionType[];

  public activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.languages.registerCodeLensProvider(this.documentSelector, this),
    );
  }
}
