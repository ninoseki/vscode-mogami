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
        "**/*-requirements.txt",
        "**/*.requirements.txt",
        "**/requirements-*.txt",
        "**/requirements.txt",
        "**/requirements/*.txt",
      ].map((pattern) => {
        return { pattern, scheme: "file" };
      }),
    );
    this.client = new PyPIClient();
  }

  public parseDocumentPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ) {
    const project = createProject(document);
    if (project.source) {
      this.client = project.getClient();
    }
    this.parse = project.getParseFn();
    return document.getWordRangeAtPosition(position, project.getRegex());
  }
}
