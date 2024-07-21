import * as vscode from "vscode";

import { PyPIClient } from "@/package/pypi";
import { createProject } from "@/project/pypi";

import { AbstractHoverProvider } from "./abstractHoverProvider";

export class PyPIHoverProvider extends AbstractHoverProvider {
  declare client: PyPIClient;

  constructor() {
    super(
      [
        "**/pyproject.toml",
        "**/{requirements.txt,requirements-*.txt,*-requirements.txt,*.requirements.txt}",
      ].map((pattern) => {
        return { pattern, scheme: "file" };
      }),
    );
    this.client = new PyPIClient();
  }

  createProject(document: vscode.TextDocument) {
    return createProject(document);
  }
}
