import { CodeLens, Range, Uri } from "vscode";

import { DependencyType, PackageType } from "@/schemas";

export class SuggestionCodeLens extends CodeLens {
  replaceRange?: Range;
  pkg: PackageType;
  deps: DependencyType;
  documentUrl: Uri;

  constructor(
    commandRange: Range,
    {
      replaceRange,
      documentUrl,
      pkg,
      deps,
    }: {
      replaceRange?: Range;
      documentUrl: Uri;
      pkg: PackageType;
      deps: DependencyType;
    },
  ) {
    super(commandRange);
    this.replaceRange = replaceRange;
    this.documentUrl = documentUrl;
    this.pkg = pkg;
    this.deps = deps;

    this.command = undefined;
  }

  setCommand(title: string, command: string, args?: Array<unknown>) {
    this.command = {
      title,
      command,
      arguments: args,
    };
    return this;
  }
}
