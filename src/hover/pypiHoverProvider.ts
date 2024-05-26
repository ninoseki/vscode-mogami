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
  }

  public parseDocumentPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ) {
    const project = createProject(document);

    this.client = project.getClient();
    this.parse = project.getParseFn();
    const regex = project.getRegex();

    return document.getWordRangeAtPosition(position, regex);
  }
}
