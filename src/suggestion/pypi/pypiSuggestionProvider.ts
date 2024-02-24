import { Result } from "neverthrow";
import * as semver from "semver";
import * as vscode from "vscode";

import type { PypiPackageType } from "@/schemas";
import { AbstractSuggestionProvider } from "@/suggestion/abstractSuggestionProvider";
import type { PypiDependency } from "@/types";

export class PypiSuggestionProvider extends AbstractSuggestionProvider {
  private dependency: PypiDependency;
  private pkg: PypiPackageType;

  constructor(dependency: PypiDependency, pkg: PypiPackageType) {
    super();

    this.dependency = dependency;
    this.pkg = pkg;
  }

  public suggest(): vscode.Command {
    if (this.isLatest()) {
      return { title: "latest", command: "" };
    }
    return { title: `latest: ${this.pkg.info.version}`, command: "" };
  }

  private isLatest(): boolean {
    if (this.dependency.requirements === this.pkg.info.version) {
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

      const v2 = semver.clean(this.pkg.info.version);
      if (!v2) {
        return false;
      }

      return semver.eq(v1, v2);
    };

    return Result.fromThrowable(inner)().unwrapOr(false);
  }
}
