import * as vscode from "vscode";

import { API } from "@/api";
import { parse } from "@/format/pip";
import { DependencyPositionType } from "@/schemas";
import { satisfies } from "@/versioning/poetry";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { createDependencyPositions } from "../dependencyPositionFactory";

export class RequirementsCodeLensProvider extends AbstractCodeLensProvider {
  constructor(concurrency: number) {
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
        getPackage: API.getPypiPackage,
        satisfies,
        concurrency,
      },
    );
  }
  parseDocuments(document: vscode.TextDocument): DependencyPositionType[] {
    return createDependencyPositions(document, { parse });
  }
}
