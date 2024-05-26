import * as vscode from "vscode";

import { PyPIClient } from "@/package/pypi";
import { createProject } from "@/project/pypi";
import { PackageClientType } from "@/schemas";

import { AbstractHoverProvider } from "../abstractHoverProvider";

export class RequirementsHoverProvider extends AbstractHoverProvider {
  declare client: PyPIClient;

  constructor(client: PackageClientType) {
    const patterns = [
      "**/*-requirements.txt",
      "**/*.requirements.txt",
      "**/requirements-*.txt",
      "**/requirements.txt",
      "**/requirements/*.txt",
    ];
    const selector = patterns.map((pattern) => {
      return { pattern, scheme: "file" };
    });
    super(selector, { client });
    this.parseLine = undefined;
  }

  public parseDocumentPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ) {
    const project = createProject(document);
    this.client = project.getClient();
    this.parseLine = project.getParseFn();
    return document.getWordRangeAtPosition(position, project.getRegExp());
  }
}
