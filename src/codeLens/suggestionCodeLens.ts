import * as E from "fp-ts/lib/Either";
import { CodeLens, Range, Uri } from "vscode";

import { DependencyType, PackageType } from "@/schemas";

export class SuggestionCodeLens extends CodeLens {
  replaceRange?: Range;
  pkg: E.Either<unknown, PackageType>;
  dependency: DependencyType;
  documentUrl: Uri;

  constructor(
    commandRange: Range,
    {
      replaceRange,
      documentUrl,
      pkg,
      dependency,
    }: {
      replaceRange?: Range;
      documentUrl: Uri;
      pkg: E.Either<unknown, PackageType>;
      dependency: DependencyType;
    },
  ) {
    super(commandRange);
    this.replaceRange = replaceRange;
    this.documentUrl = documentUrl;
    this.pkg = pkg;
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
