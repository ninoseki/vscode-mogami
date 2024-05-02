import * as vscode from "vscode";

import { API } from "@/api";
import { buildDepsRegExp, parse as _parse } from "@/format/poetry";
import { satisfies } from "@/versioning/poetry";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { createCodeLenses } from "../codeLensFactory";

export class PyProjectCodeLensProvider extends AbstractCodeLensProvider {
  constructor() {
    super({
      pattern: "**/pyproject.toml",
      scheme: "file",
    });
  }

  public async provideCodeLenses(document: vscode.TextDocument) {
    const depsRegExp = buildDepsRegExp(document.getText());
    const parse = (line: string) => {
      return _parse(line, depsRegExp);
    };
    return await createCodeLenses({
      document,
      parse,
      getPackage: API.getPypiPackage,
      satisfies,
    });
  }
}
