import { VERSION_PATTERN } from "@renovatebot/pep440/lib/version";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as path from "path";
import * as vscode from "vscode";

import { Logger } from "@/logger";
import { PyPIClient } from "@/package/pypi";
import { DependencyType, ParseFnType, ProjectFormatType } from "@/schemas";

import * as poetry from "../format/poetry";
import * as pyproject from "../format/pyproject";
import * as requirements from "../format/requirements";
import { AbstractProject } from "./abstractProject";

const RANGE_PATTERN = [
  "(?<operator>(===|~=|==|!=|<=|>=|<|>|\\^))",
  "\\s*",
  "(",
  /*  */ "(?<version>(?:" + VERSION_PATTERN.replace(/\?<\w+>/g, "?:") + "))",
  /*  */ "(?<prefix>\\.\\*)?",
  /*  */ "|",
  /*  */ "(?<legacy>[^,;\\s)]+)",
  ")",
].join("");

const specifierPartPattern = `\\s*${RANGE_PATTERN.replace(
  RegExp(/\?<\w+>/g),
  "?:",
)}`;
const specifierPattern = `${specifierPartPattern}(?:\\s*,${specifierPartPattern})*`;
export const specifierRegex = new RegExp(specifierPattern);
export const versionRegex = new RegExp(VERSION_PATTERN);

export function buildRegex(
  dependencies: string[],
  format: ProjectFormatType,
): RegExp {
  const sorted = dependencies.sort().reverse();
  switch (format) {
    case "poetry":
      return new RegExp("^(?<name>" + sorted.join("|") + `)\\W(?<rest>.+)?$`);
    case "pyproject":
      return new RegExp("(?<name>" + sorted.join("|") + `)(?<rest>.+)?`);
    default:
      return new RegExp("^(?<name>" + sorted.join("|") + `)(?<rest>.+)?$`);
  }
}

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

class PythonProject extends AbstractProject {
  getClient(): PyPIClient {
    const client = new PyPIClient(this.source);
    client.usePrivateSource = this.usePrivateSource;
    return client;
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
