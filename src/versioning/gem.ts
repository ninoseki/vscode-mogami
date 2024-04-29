import { Requirement } from "@renovatebot/ruby-semver/dist/ruby/requirement";
import { Version } from "@renovatebot/ruby-semver/dist/ruby/version";
import { fromThrowable } from "neverthrow";

export function satisfies(version: string, specifier?: string): boolean {
  const inner = () => {
    const req = Requirement.create(specifier);
    const v = Version.create(version);
    if (!v) {
      throw Error("Failed to parse the version");
    }
    return req.isSatisfiedBy(v);
  };

  return fromThrowable(inner, (e: unknown) => e)().unwrapOr(false);
}
