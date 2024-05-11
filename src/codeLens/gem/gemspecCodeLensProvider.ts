import * as vscode from "vscode";

import { parse } from "@/format/gemspec";
import { getPackage } from "@/package/gem";
import { DependencyPositionType } from "@/schemas";
import { satisfies } from "@/versioning/gem";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { createDependencyPositions } from "../dependencyPositionFactory";

export class GemspecCodeLensProvider extends AbstractCodeLensProvider {
  constructor(concurrency: number) {
    super(
      {
        pattern: "**/*.gemspec",
        scheme: "file",
      },
      {
        satisfies,
        getPackage,
        concurrency,
      },
    );
  }

  parseDocuments(document: vscode.TextDocument): DependencyPositionType[] {
    return createDependencyPositions(document, { parse });
  }
}
