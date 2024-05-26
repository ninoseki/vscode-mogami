import * as E from "fp-ts/lib/Either";
import * as vscode from "vscode";

import { GemClient } from "@/package/gem";
import { ParseFnType, ProjectFormatType, ProjectType } from "@/schemas";

import * as gemfile from "../format/gemfile";
import * as gemspec from "../format/gemspec";

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

  getParseFn(): ParseFnType {
    switch (this.format) {
      case "gemfile":
        return gemfile.parse;
      default:
        return gemspec.parse;
    }
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
