import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import { tryCatch } from "fp-ts/lib/TaskEither";
import * as vscode from "vscode";

import { ExtensionComponent } from "@/extensionComponent";
import { createProject } from "@/project";
import { createService } from "@/service";

export class HoverProvider implements vscode.HoverProvider, ExtensionComponent {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event;

  constructor(private documentSelector: vscode.DocumentSelector) {
    this.documentSelector = documentSelector;

    vscode.workspace.onDidChangeConfiguration(() => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.Hover | undefined> {
    const project = createProject(document);
    const service = createService(project);

    const range = this.parseDocumentPosition(document, position, project.regex);
    const line = document.lineAt(position.line).text.trim();

    const dependency = service.parse(line);
    if (!dependency) {
      return;
    }

    const safeGetPackage = (name: string) => {
      return tryCatch(
        () => service.client.get(name),
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
          `Latest version: ${pkg.version}`,
          pkg.url,
        ].filter((i): i is Exclude<typeof i, undefined> => i !== undefined);
        const message = sections.join("\n\n");
        return new vscode.Hover(message, range);
      }),
      E.getOrElseW(() => undefined),
    );
  }

  public parseDocumentPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
    regex: RegExp,
  ) {
    return document.getWordRangeAtPosition(position, regex);
  }

  public activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider(this.documentSelector, this),
    );
  }
}
