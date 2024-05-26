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

  satisfies: SatisfiesFnType;
  concurrency: number;
  state: CodeLensState;
  abstract client: PackageClientType;

  name?: string;

  constructor(
    private documentSelector: vscode.DocumentSelector,
    {
      state,
      satisfies,
      concurrency = 5,
    }: {
      state: CodeLensState;
      concurrency?: number;
      satisfies: SatisfiesFnType;
    },
  ) {
    this.documentSelector = documentSelector;

    this.concurrency = concurrency;
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

    const dependencyPositions = this.parseDocuments(document);
    const codeLenses = await createCodeLenses({
      document,
      dependencyPositions,
      satisfies: this.satisfies,
      client: this.client,
      concurrency: this.concurrency,
    });

    await this.state.clearProviderBusy();

    return codeLenses;
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
