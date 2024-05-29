import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as path from "path";
import * as vscode from "vscode";

import { Logger } from "@/logger";
import { PyPIClient } from "@/package/pypi";
import {
  DependencyType,
  ParseFnType,
  ProjectFormatType,
  ProjectType,
} from "@/schemas";

import * as poetry from "../format/poetry";
import * as pyproject from "../format/pyproject";
import * as requirements from "../format/requirements";
import { buildRegex, specifierRegex, versionRegex } from "./pypiUtils";

export function parse(line: string, regex: RegExp): DependencyType | undefined {
  const matches = regex.exec(line);
  if (!matches) {
    return undefined;
  }
  const name = matches.groups?.name;
  if (!name) {
    return undefined;
  }

  const specifier = ((): string | undefined => {
    return pipe(
      O.fromNullable(matches.groups?.rest),
      O.flatMap((s: string) => {
        const matches = specifierRegex.exec(s) || versionRegex.exec(s);
        if (matches) {
          return O.some(matches[0].trim());
        }
        return O.none;
      }),
      O.getOrElseW(() => undefined),
    );
  })();

  return { name, specifier };
}

class PythonProject {
  dependencies: string[];
  source?: string;
  format: ProjectFormatType;

  constructor({ dependencies, source, format }: ProjectType) {
    this.dependencies = dependencies;
    this.source = source;
    this.format = format;
  }

  getClient(): PyPIClient {
    return new PyPIClient(this.source);
  }

  getRegex(): RegExp {
    return buildRegex(this.dependencies, this.format);
  }

  getParseFn(): ParseFnType {
    return (line: string) => {
      return parse(line, this.getRegex());
    };
  }
}

export function createProject(document: vscode.TextDocument): PythonProject {
  const text = document.getText();
  const basename = path.basename(document.fileName);

  if (basename === "pyproject.toml") {
    // Poetry
    const poetryResult = E.tryCatch(
      () => {
        const project = poetry.createProject(text);
        if (project.dependencies.length === 0) {
          throw new Error("No dependency found in Poetry manifest");
        } else {
          Logger.info(
            `Poetry detected: ${project.dependencies.length} dependencies found`,
          );
        }

        return project;
      },
      (e: unknown) => e,
    );
    if (E.isRight(poetryResult)) {
      return new PythonProject(poetryResult.right);
    } else {
      Logger.error(poetryResult.left);
    }

    // pyproject.toml
    const pyprojectResult = E.tryCatch(
      () => {
        const project = pyproject.createProject(text);
        if (project.dependencies.length === 0) {
          throw new Error("No dependency found in pyproject.toml manifest");
        } else {
          Logger.info(
            `pyproject.toml detected: ${project.dependencies.length} dependencies found`,
          );
        }
        return project;
      },
      (e: unknown) => e,
    );
    if (E.isRight(pyprojectResult)) {
      return new PythonProject(pyprojectResult.right);
    } else {
      Logger.error(pyprojectResult.left);
    }
  } else {
    // requirements.txt
    const result = E.tryCatch(
      () => {
        const project = requirements.createProject(text);
        if (project.dependencies.length === 0) {
          throw new Error("No dependency found in requirements.txt manifest");
        } else {
          Logger.info(
            `requirements.txt detected: ${project.dependencies.length} dependencies found`,
          );
        }
        return project;
      },
      (e: unknown) => e,
    );
    if (E.isRight(result)) {
      return new PythonProject(result.right);
    } else {
      Logger.error(result.left);
    }
  }

  throw new Error("Unsupported PyPI format");
}
