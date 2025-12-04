import { Requirement } from "@renovatebot/ruby-semver/dist/ruby/requirement";
import { Version } from "@renovatebot/ruby-semver/dist/ruby/version";
import { Result } from "neverthrow";

import { DependencyType } from "@/schemas";

export function satisfies(
  version: string,
  dependency: DependencyType,
): boolean {
  const result = Result.fromThrowable(() => {
    const req = Requirement.create(...(dependency.specifierRequirements || []));
    const v = Version.create(version);
    if (!v) {
      throw new Error("Failed to parse the version");
    }
    return req.isSatisfiedBy(v);
  })();
  return result.unwrapOr(false);
}
