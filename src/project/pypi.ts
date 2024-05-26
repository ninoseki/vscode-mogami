import { VERSION_PATTERN } from "@renovatebot/pep440/lib/version";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as O from "fp-ts/Option";
import * as vscode from "vscode";

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
const specifierRegExp = new RegExp(specifierPattern);
const versionRegExp = new RegExp(VERSION_PATTERN);

export function buildRegExp(dependencies: string[], format: string): RegExp {
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

export function parse(
  line: string,
  regExp: RegExp,
): DependencyType | undefined {
  const matches = regExp.exec(line);
  if (!matches) {
    return undefined;
  }
  const name = matches.groups?.name;
  if (!name) {
    return undefined;
  }

  const specifier = (() => {
    return pipe(
      O.fromNullable(matches.groups?.rest),
      O.flatMap((s: string) => {
        const matches = specifierRegExp.exec(s) || versionRegExp.exec(s);
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

  getRegExp(): RegExp {
    return buildRegExp(this.dependencies, this.format);
  }

  getParseFn(): ParseFnType {
    return (line: string) => {
      return parse(line, this.getRegExp());
    };
  }
}

export function createProject(document: vscode.TextDocument): PythonProject {
  const text = document.getText();

  if (document.fileName.endsWith("/pyproject.toml")) {
    const functions = [poetry.createProject, pyproject.createProject];
    for (const f of functions) {
      const result = E.tryCatch(
        () => f(text),
        (e: unknown) => e,
      );
      if (E.isRight(result)) {
        return new PythonProject(result.right);
      }
    }
  } else {
    const result = E.tryCatch(
      () => requirements.createProject(text),
      (e: unknown) => e,
    );
    if (E.isRight(result)) {
      return new PythonProject(result.right);
    }
  }

  throw new Error("Unsupported PyPI format");
}
