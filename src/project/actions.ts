import * as vscode from "vscode";

import { nameSpecifierRegexParse } from "@/format/utils";
import { GitHubClient } from "@/package/github";
import { ParseFnType } from "@/schemas";

import * as actions from "../format/actions";
import { AbstractProject } from "./abstractProject";

class ActionsProject extends AbstractProject {
  getClient(): GitHubClient {
    return new GitHubClient(this.source);
  }

  getRegex(): RegExp {
    return actions.regex;
  }

  getParseFn(): ParseFnType {
    return (line: string) => {
      return nameSpecifierRegexParse(line, this.getRegex());
    };
  }
}

export function createProject(document: vscode.TextDocument): ActionsProject {
  const text = document.getText();
  return new ActionsProject(actions.createProject(text));
}
