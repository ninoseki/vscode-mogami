import * as E from "fp-ts/lib/Either";
import * as vscode from "vscode";

import { nameSpecifierRegexParse } from "@/format/utils";
import { GemClient } from "@/package/gem";
import { ParseFnType } from "@/schemas";

import * as gemfile from "../format/gemfile";
import * as gemspec from "../format/gemspec";
import { AbstractProject } from "./abstractProject";

class GemProject extends AbstractProject {
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
      return nameSpecifierRegexParse(line, this.getRegex());
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
