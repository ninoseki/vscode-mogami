import * as vscode from "vscode";

import { API } from "@/api";
import { CodeLensState } from "@/contextState";
import { parse } from "@/format/pip";
import { DependencyPositionType } from "@/schemas";
import { satisfies } from "@/versioning/poetry";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { createDependencyPositions } from "../dependencyPositionFactory";

export class RequirementsCodeLensProvider extends AbstractCodeLensProvider {
  constructor(state: CodeLensState, concurrency: number) {
    super(
      [
        "**/*-requirements.txt",
        "**/*.requirements.txt",
        "**/requirements-*.txt",
        "**/requirements.txt",
        "**/requirements/*.txt",
      ].map((pattern) => {
        return { pattern, scheme: "file" };
      }),
      {
        state,
        getPackage: API.getPypiPackage,
        satisfies,
        concurrency,
      },
    );
    this.name = "RequirementsCodeLensProvider";
  }

  parseDocuments(document: vscode.TextDocument): DependencyPositionType[] {
    return createDependencyPositions(document, { parse });
  }
}
