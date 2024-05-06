import * as vscode from "vscode";

import { API } from "@/api";
import { AbstractCodeLensProvider } from "@/codeLens/abstractCodeLensProvider";
import { DependencyType, PackageType } from "@/schemas";
import { satisfies } from "@/versioning/gem";

import { createCodeLenses } from "../codeLensFactory";

async function getPackage(name: string): Promise<PackageType> {
  const gem = await API.getGem(name);
  const versions = await API.getGemVersions(name);

  gem.versions = versions.map((v) => v.number);

  return gem;
}

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
      getPackage,
    });
  }
}
