import * as vscode from "vscode";

import { API } from "@/api";
import { AbstractCodeLensProvider } from "@/codeLens/abstractCodeLensProvider";
import { DependencyType } from "@/schemas";
import { satisfies } from "@/versioning/gem";

import { createCodeLenses } from "../codeLensFactory";

export class BaseGemCodeLensProvider extends AbstractCodeLensProvider {
  private parse: (line: string) => DependencyType | undefined;

  constructor(
    documentSelector: vscode.DocumentSelector,
    {
      parse,
    }: {
      parse: (line: string) => DependencyType | undefined;
    },
  ) {
    super(documentSelector);
    this.parse = parse;
  }

  public async provideCodeLenses(document: vscode.TextDocument) {
    return await createCodeLenses({
      document,
      satisfies,
      parse: this.parse,
      getPackage: API.getGem,
    });
  }
}
