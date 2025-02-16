import camelcaseKeys from "camelcase-keys";
import semver from "semver";
import urlJoin from "url-join";

import { getGitHubPersonalAccessToken } from "@/configuration";
import { GitHubReleasesSchema, PackageType } from "@/schemas";

import { AbstractPackageClient } from "./abstractClient";
export class GitHubClient extends AbstractPackageClient {
  private gitHubPersonalAccessToken: string | null = null;
  private preserveVersionPrefix: boolean;

  constructor(
    privateSource?: string,
    { preserveVersionPrefix }: { preserveVersionPrefix: boolean } = {
      preserveVersionPrefix: true,
    },
  ) {
    super("https://api.github.com", privateSource);
    this.gitHubPersonalAccessToken = getGitHubPersonalAccessToken();
    this.preserveVersionPrefix = preserveVersionPrefix;
  }

  async get(name: string): Promise<PackageType> {
    const headers = (() => {
      if (this.gitHubPersonalAccessToken) {
        return { authorization: `Bearer ${this.gitHubPersonalAccessToken}` };
      }
      return {};
    })();

    const res = await this.client.get(
      urlJoin(this.source.toString(), "repos", name, "releases"),
      { headers },
    );
    const releases = GitHubReleasesSchema.parse(
      camelcaseKeys(res.data, { deep: true }),
    );
    if (releases.length > 0) {
      const release = releases[0];
      const coerceOrOriginal = (tagName: string): string =>
        // apply coerce if preserveVersionPrefix is true
        this.preserveVersionPrefix
          ? semver.coerce(tagName)?.version || tagName
          : tagName;

      return {
        name,
        version: coerceOrOriginal(release.tagName),
        versions: releases.map((r) => coerceOrOriginal(r.tagName)),
      };
    }

    throw Error("There is no release");
  }
}
