import TOML from "@iarna/toml";
import { tryCatch } from "fp-ts/lib/Either";
import * as E from "fp-ts/lib/Either";
import * as vscode from "vscode";

import {
  buildDepsRegExp as poetryBuildDepsRegExp,
  parse as regExpParse,
} from "@/format/poetry";
import { buildDepsRegExp as pyProjectBuildDepsRegExp } from "@/format/pyproject";
import {
  DependencyPositionType,
  PackageClientType,
  PoetryProjectSchema,
} from "@/schemas";
import { satisfies } from "@/versioning/poetry";

import { AbstractCodeLensProvider } from "../abstractCodeLensProvider";
import { CodeLensState } from "../codeLensState";
import { createDependencyPositions } from "../dependencyPositionFactory";

export function isPoetry(text: string): boolean {
  const result = tryCatch(
    () => {
      PoetryProjectSchema.parse(TOML.parse(text));
    },
    (e: unknown) => e,
  );

  return E.isRight(result);
}
export class PyProjectCodeLensProvider extends AbstractCodeLensProvider {
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
        pattern: "**/pyproject.toml",
        scheme: "file",
      },
      {
        state,
        client,
        satisfies,
        concurrency,
      },
    );
    this.name = "PyProjectCodeLensProvider";
  }

  parseDocuments(document: vscode.TextDocument): DependencyPositionType[] {
    if (isPoetry(document.getText())) {
      const depsRegExp = poetryBuildDepsRegExp(document.getText());
      const parse = (line: string) => {
        return regExpParse(line, depsRegExp);
      };
      return createDependencyPositions(document, { parse });
    }

    const depsRegExp = pyProjectBuildDepsRegExp(document.getText());
    const parse = (line: string) => {
      return regExpParse(line, depsRegExp);
    };
    return createDependencyPositions(document, { parse });
  }
}
