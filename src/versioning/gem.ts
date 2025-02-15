import { Requirement } from "@renovatebot/ruby-semver/dist/ruby/requirement";
import { Version } from "@renovatebot/ruby-semver/dist/ruby/version";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import { DependencyType } from "@/schemas";

const safeRequirementCreate = (
  specifierRequirements?: string[],
): E.Either<unknown, Requirement> => {
  return E.tryCatch<unknown, Requirement>(
    () => Requirement.create(...(specifierRequirements || [])),
    (e: unknown) => e,
  );
};

export function satisfies(
  version: string,
  dependency: DependencyType,
): boolean {
  return pipe(
    safeRequirementCreate(dependency.specifierRequirements),
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
