import { Result } from "neverthrow";
import * as semver from "semver";
import * as vscode from "vscode";

import type { GemType } from "@/schemas";
import { AbstractSuggestionProvider } from "@/suggestion/abstractSuggestionProvider";
import type { GemDependency } from "@/types";

export class GemSuggestionProvider extends AbstractSuggestionProvider {
  private dependency: GemDependency;
  private gem: GemType;

  constructor(dependency: GemDependency, gem: GemType) {
    super();

    this.dependency = dependency;
    this.gem = gem;
  }

  public suggest(): vscode.Command {
    if (this.isLatest()) {
      return { title: "latest", command: "" };
    }
    return { title: `latest: ${this.gem.version}`, command: "" };
  }

  private isLatest(): boolean {
    if (this.dependency.requirements === this.gem.version) {
      return true;
    }

    const inner = () => {
      if (!this.dependency.requirements) {
        return false;
      }

      const v1 = semver.clean(this.dependency.requirements);
      if (!v1) {
        return false;
      }

      const v2 = semver.clean(this.gem.version);
      if (!v2) {
        return false;
      }

      return semver.eq(v1, v2);
    };

    return Result.fromThrowable(inner)().unwrapOr(false);
  }
}
