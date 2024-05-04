import { Requirement } from "@renovatebot/ruby-semver/dist/ruby/requirement";
import { Version } from "@renovatebot/ruby-semver/dist/ruby/version";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

export function satisfies(version: string, specifier?: string): boolean {
  const safeRequirementCreate = (
    specifier?: string,
  ): E.Either<unknown, Requirement> =>
    E.tryCatch<unknown, Requirement>(
      () => Requirement.create(specifier),
      (e: unknown) => e,
    );
  return pipe(
    safeRequirementCreate(specifier),
    E.flatMap((req) => {
      const v = Version.create(version);
      if (!v) {
        return E.left(new Error("Failed to parse the version"));
      }
      return E.right(req.isSatisfiedBy(v));
    }),
    E.getOrElseW(() => false),
  );
}
