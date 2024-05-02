import { Requirement } from "@renovatebot/ruby-semver/dist/ruby/requirement";
import { Version } from "@renovatebot/ruby-semver/dist/ruby/version";
import { err, fromThrowable, ok } from "neverthrow";

export function satisfies(version: string, specifier?: string): boolean {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  return fromThrowable(Requirement.create)(specifier)
    .andThen((req) => {
      const v = Version.create(version);
      if (!v) {
        return err("Failed to parse the version");
      }
      return ok(req.isSatisfiedBy(v));
    })
    .unwrapOr(false);
}
