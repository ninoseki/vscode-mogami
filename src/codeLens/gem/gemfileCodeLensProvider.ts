import * as vscode from "vscode";

import { CodeLensState } from "@/contextState";
import { parse } from "@/format/gemfile";
import { getPackage } from "@/package/gem";
import { DependencyPositionType } from "@/schemas";
import { satisfies } from "@/versioning/gem";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { createDependencyPositions } from "../dependencyPositionFactory";

export class GemfileCodeLensProvider extends AbstractCodeLensProvider {
  constructor(state: CodeLensState, concurrency: number) {
    super(
      {
        pattern: "**/Gemfile",
        scheme: "file",
      },
      {
        state,
        satisfies,
        getPackage,
        concurrency,
      },
    );
    this.name = "GemfileCodeLensProvider";
  }

  parseDocuments(document: vscode.TextDocument): DependencyPositionType[] {
    return createDependencyPositions(document, { parse });
  }
}
