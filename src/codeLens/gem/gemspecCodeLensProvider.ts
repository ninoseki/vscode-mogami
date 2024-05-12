import * as vscode from "vscode";

import { CodeLensState } from "@/contextState";
import { parse } from "@/format/gemspec";
import { getPackage } from "@/package/gem";
import { DependencyPositionType } from "@/schemas";
import { satisfies } from "@/versioning/gem";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { createDependencyPositions } from "../dependencyPositionFactory";

export class GemspecCodeLensProvider extends AbstractCodeLensProvider {
  constructor(state: CodeLensState, concurrency: number) {
    super(
      {
        pattern: "**/*.gemspec",
        scheme: "file",
      },
      {
        state,
        satisfies,
        getPackage,
        concurrency,
      },
    );
    this.name = "GemspecCodeLensProvider";
  }

  parseDocuments(document: vscode.TextDocument): DependencyPositionType[] {
    return createDependencyPositions(document, { parse });
  }
}
