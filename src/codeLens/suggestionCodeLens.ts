import { Result } from "neverthrow";
import { CodeLens, Range, Uri } from "vscode";

import { DependencyType, PackageType } from "@/schemas";

export class SuggestionCodeLens extends CodeLens {
  replaceRange?: Range;
  pkgResult: Result<PackageType, unknown>;
  dependency: DependencyType;
  documentUrl: Uri;

  constructor(
    commandRange: Range,
    {
      replaceRange,
      documentUrl,
      pkgResult,
      dependency,
    }: {
      replaceRange?: Range;
      documentUrl: Uri;
      pkgResult: Result<PackageType, unknown>;
      dependency: DependencyType;
    },
  ) {
    super(commandRange);
    this.replaceRange = replaceRange;
    this.documentUrl = documentUrl;
    this.pkgResult = pkgResult;
    this.dependency = dependency;

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
