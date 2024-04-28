import { Requirement } from "@renovatebot/ruby-semver/dist/ruby/requirement";
import { Version } from "@renovatebot/ruby-semver/dist/ruby/version";
import { fromThrowable } from "neverthrow";
import * as vscode from "vscode";

import type { DependencyType, GemType } from "@/schemas";
import { AbstractSuggestionProvider } from "@/suggestion/abstractSuggestionProvider";

export class GemSuggestionProvider extends AbstractSuggestionProvider {
  private deps: DependencyType;
  private gem: GemType;

  constructor(deps: DependencyType, gem: GemType) {
    super();

    this.deps = deps;
    this.gem = gem;
  }

  public suggest(): vscode.Command {
    const direction = this.isSatisfied() ? "" : "↑ ";
    const title = `${direction}latest: ${this.gem.version}`;
    return { title, command: "" };
  }

  private isSatisfied(): boolean {
    const inner = () => {
      const req = Requirement.create(this.deps.specifier);
      const v = Version.create(this.gem.version);
      if (!v) {
        throw Error("Failed to parse the version");
      }
      return req.isSatisfiedBy(v);
    };

    return fromThrowable(inner, (e: unknown) => e)().unwrapOr(false);
  }
}
