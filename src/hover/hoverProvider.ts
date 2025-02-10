import * as vscode from "vscode";

import { ExtensionComponent } from "@/extensionComponent";
import { ProjectParser } from "@/project";

export class HoverProvider implements vscode.HoverProvider, ExtensionComponent {
  private _onDidChangeConfiguration: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();

  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeConfiguration.event;

  constructor(
    private documentSelector: vscode.DocumentSelector,
    private projectParser: ProjectParser,
  ) {
    this.documentSelector = documentSelector;
    this.projectParser = projectParser;

    vscode.workspace.onDidChangeConfiguration(() => {
      this._onDidChangeConfiguration.fire();
    });
  }

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): Promise<vscode.Hover | undefined> {
    const service = this.projectParser.parse(document);
    const got = service.getDependencyByPosition(position);
    if (!got) {
      return;
    }
    const dependency = got[0];
    const range = got[1];

    try {
      const pkg = await service.getPackage(dependency.name);
      const sections = [
        pkg.summary,
        `Latest version: ${pkg.version}`,
        pkg.url,
      ].filter((i): i is Exclude<typeof i, undefined> => i !== undefined);
      const message = sections.join("\n\n");
      return new vscode.Hover(message, range);
    } catch {
      return;
    }
  }

  public activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
      vscode.languages.registerHoverProvider(this.documentSelector, this),
    );
  }
}
