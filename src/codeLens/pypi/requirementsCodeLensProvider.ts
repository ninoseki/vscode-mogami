import * as vscode from "vscode";

import { API } from "@/api";
import { parse } from "@/format/pip";
import { satisfies } from "@/versioning/poetry";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { createCodeLenses } from "../codeLensFactory";

export class RequirementsCodeLensProvider extends AbstractCodeLensProvider {
  constructor() {
    super(
      [
        "**/*-requirements.txt",
        "**/*.requirements.txt",
        "**/requirements-*.txt",
        "**/requirements.txt",
        "**/requirements/*.txt",
      ].map((pattern) => {
        return { pattern, scheme: "file" };
      }),
    );
  }

  public async provideCodeLenses(document: vscode.TextDocument) {
    return await createCodeLenses({
      document,
      parse,
      getPackage: API.getPypiPackage,
      satisfies,
    });
  }
}
