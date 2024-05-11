import assert from "assert";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { tryCatch } from "fp-ts/lib/TaskEither";
import * as vscode from "vscode";

import { ExtensionComponent } from "@/extensionComponent";
import { GetPackageFnType, ParseFnType } from "@/types";

export abstract class AbstractHoverProvider
  implements vscode.HoverProvider, ExtensionComponent
{
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  public getPackage: GetPackageFnType;

  public parseLine?: ParseFnType;

  constructor(
    private documentSelector: vscode.DocumentSelector,
    { getPackage }: { getPackage: GetPackageFnType },
  ) {
    this.documentSelector = documentSelector;

    this.getPackage = getPackage;

    vscode.workspace.onDidChangeConfiguration(() => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public abstract parseDocumentPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.Range | undefined;

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.Hover | undefined> {
    assert(this.parseLine);

    const range = this.parseDocumentPosition(document, position);
    const line = document.lineAt(position.line).text.trim();

    const dependency = this.parseLine(line);
    if (!dependency) {
      return;
    }

    const safeGetPackage = (name: string) => {
      return tryCatch(
        () => this.getPackage(name),
        (e: unknown) => e,
      );
    };

    const task = safeGetPackage(dependency.name);
    const result = await task();
    return pipe(
      result,
      E.map((pkg) => {
        const message = `${pkg.summary}\n\nLatest version: ${pkg.version}\n\n${pkg.url}`;
        return new vscode.Hover(message, range);
      }),
      E.getOrElseW(() => undefined),
    );
  }

  public activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider(this.documentSelector, this),
    );
  }
}
