import * as vscode from "vscode";

import { CodeLensState } from "@/contextState";
import { parse } from "@/format/gemfile";
import { DependencyPositionType, PackageClientType } from "@/schemas";
import { satisfies } from "@/versioning/gem";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { createDependencyPositions } from "../dependencyPositionFactory";

export class GemfileCodeLensProvider extends AbstractCodeLensProvider {
  constructor({
    state,
    concurrency,
    client,
  }: {
    state: CodeLensState;
    concurrency: number;
    client: PackageClientType;
  }) {
    super(
      {
        pattern: "**/Gemfile",
        scheme: "file",
      },
      {
        state,
        satisfies,
        client,
        concurrency,
      },
    );
    this.name = "GemfileCodeLensProvider";
  }

  parseDocuments(document: vscode.TextDocument): DependencyPositionType[] {
    return createDependencyPositions(document, { parse });
  }
}
