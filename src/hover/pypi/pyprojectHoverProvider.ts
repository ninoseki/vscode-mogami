import * as vscode from "vscode";

import { createPythonProject } from "@/format/pypi";
import { PyPIClient } from "@/package/pypi";
import { PackageClientType } from "@/schemas";

import { AbstractHoverProvider } from "../abstractHoverProvider";

export class PyProjectHoverProvider extends AbstractHoverProvider {
  declare client: PyPIClient;

  constructor(client: PackageClientType) {
    super({ pattern: "**/pyproject.toml", scheme: "file" }, { client });
    this.parseLine = undefined;
  }

  public parseDocumentPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ) {
    const project = createPythonProject(document);
    this.client = project.getClient();
    this.parseLine = project.getParseFn();
    return document.getWordRangeAtPosition(position, project.getRegExp());
  }
}
