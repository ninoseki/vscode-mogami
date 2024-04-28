import * as vscode from "vscode";

import type { DependencyType, PypiPackageType } from "@/schemas";
import { AbstractSuggestionProvider } from "@/suggestion/abstractSuggestionProvider";
import { satisfies } from "@/versioning/poetry";

export class PypiSuggestionProvider extends AbstractSuggestionProvider {
  private deps: DependencyType;
  private pkg: PypiPackageType;

  constructor(deps: DependencyType, pkg: PypiPackageType) {
    super();

    this.deps = deps;
    this.pkg = pkg;
  }

  public suggest(): vscode.Command {
    const direction = satisfies(this.pkg.info.version, this.deps.specifier)
      ? ""
      : "↑ ";
    const title = `${direction}latest: ${this.pkg.info.version}`;
    return {
      title,
      command: "",
    };
  }
}
