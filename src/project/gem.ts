import * as E from "fp-ts/lib/Either";
import * as vscode from "vscode";

import { GemClient } from "@/package/gem";
import {
  DependencyType,
  ParseFnType,
  ProjectFormatType,
  ProjectType,
} from "@/schemas";

import * as gemfile from "../format/gemfile";
import * as gemspec from "../format/gemspec";

export function parse(line: string, regex: RegExp): DependencyType | undefined {
  const matches = regex.exec(line);
  if (!matches) {
    return undefined;
  }
  const name = matches.groups?.name;
  if (!name) {
    return undefined;
  }
  const specifier = matches.groups?.specifier;
  return { name, specifier };
}

class GemProject {
  dependencies: string[];
  source?: string;
  format: ProjectFormatType;

  constructor({ dependencies, source, format }: ProjectType) {
    this.dependencies = dependencies;
    this.source = source;
    this.format = format;
  }

  getClient(): GemClient {
    return new GemClient(this.source);
  }

  getRegex(): RegExp {
    switch (this.format) {
      case "gemfile":
        return gemfile.regex;
      default:
        return gemspec.regex;
    }
  }

  getParseFn(): ParseFnType {
    return (line: string) => {
      return parse(line, this.getRegex());
    };
  }
}

export function createProject(document: vscode.TextDocument): GemProject {
  const text = document.getText();

  if (document.fileName.endsWith("/Gemfile")) {
    const result = E.tryCatch(
      () => gemfile.createProject(text),
      (e: unknown) => e,
    );
    if (E.isRight(result)) {
      return new GemProject(result.right);
    }
  } else {
    const result = E.tryCatch(
      () => gemspec.createProject(text),
      (e: unknown) => e,
    );
    if (E.isRight(result)) {
      return new GemProject(result.right);
    }
  }

  throw new Error("Unsupported Gem format");
}
