import * as vscode from "vscode";

import { ExtensionComponent } from "@/extensionComponent";
import { DependencyPositionType } from "@/schemas";
import { GetPackageFnType, SatisfiesFnType } from "@/types";

import { createCodeLenses } from "./codeLensFactory";

export abstract class AbstractCodeLensProvider
  implements vscode.CodeLensProvider, ExtensionComponent
{
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  public concurrency: number;
  public getPackage: GetPackageFnType;
  public satisfies: SatisfiesFnType;

  constructor(
    private documentSelector: vscode.DocumentSelector,
    {
      getPackage,
      satisfies,
      concurrency = 5,
    }: {
      concurrency?: number;
      getPackage: GetPackageFnType;
      satisfies: SatisfiesFnType;
    },
  ) {
    this.documentSelector = documentSelector;

    this.getPackage = getPackage;
    this.satisfies = satisfies;
    this.concurrency = concurrency;

    vscode.workspace.onDidChangeConfiguration(() => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public async provideCodeLenses(document: vscode.TextDocument) {
    const dependencyPositions = this.parseDocuments(document);
    return await createCodeLenses({
      document,
      dependencyPositions,
      satisfies: this.satisfies,
      getPackage: this.getPackage,
      concurrency: this.concurrency,
    });
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
