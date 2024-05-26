import assert from "assert";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { tryCatch } from "fp-ts/lib/TaskEither";
import * as vscode from "vscode";

import { ExtensionComponent } from "@/extensionComponent";
import { PackageClientType, ParseFnType } from "@/schemas";

export abstract class AbstractHoverProvider
  implements vscode.HoverProvider, ExtensionComponent
{
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  client: PackageClientType;
  parseLine?: ParseFnType;

  constructor(
    private documentSelector: vscode.DocumentSelector,
    { client }: { client: PackageClientType },
  ) {
    this.documentSelector = documentSelector;
    this.client = client;

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
    const range = this.parseDocumentPosition(document, position);
    const line = document.lineAt(position.line).text.trim();

    // NOTE: this.parseLine may be set after analyzing document...
    assert(this.parseLine);

    const dependency = this.parseLine(line);
    if (!dependency) {
      return;
    }

    const safeGetPackage = (name: string) => {
      return tryCatch(
        () => this.client.get(name),
        (e: unknown) => e,
      );
    };

    const task = safeGetPackage(dependency.name);
    const result = await task();
    return pipe(
      result,
      E.map((pkg) => {
        const sections = [
          pkg.summary,
          `Latest version:${pkg.version}`,
          pkg.url,
        ].filter((i): i is Exclude<typeof i, undefined> => i !== undefined);
        const message = sections.join("\n\n");
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
