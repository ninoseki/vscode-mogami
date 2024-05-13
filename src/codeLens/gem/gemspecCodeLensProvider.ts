import * as vscode from "vscode";

import { CodeLensState } from "@/contextState";
import { parse } from "@/format/gemspec";
import { DependencyPositionType, PackageClientType } from "@/schemas";
import { satisfies } from "@/versioning/gem";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { createDependencyPositions } from "../dependencyPositionFactory";

export class GemspecCodeLensProvider extends AbstractCodeLensProvider {
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
        pattern: "**/*.gemspec",
        scheme: "file",
      },
      {
        state,
        satisfies,
        concurrency,
        client,
      },
    );
    this.name = "GemspecCodeLensProvider";
  }

  parseDocuments(document: vscode.TextDocument): DependencyPositionType[] {
    return createDependencyPositions(document, { parse });
  }
}
