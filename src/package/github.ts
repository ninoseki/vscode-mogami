import camelcaseKeys from "camelcase-keys";
import urlJoin from "url-join";

import { getGitHubPersonalAccessToken } from "@/configuration";
import { GitHubReleasesSchema, PackageType } from "@/schemas";

import { AbstractPackageClient } from "./abstractClient";

export class GitHubClient extends AbstractPackageClient {
  private gitHubPersonalAccessToken: string | null = null;

  constructor(privateSource?: string) {
    super("https://api.github.com", privateSource);
    this.gitHubPersonalAccessToken = getGitHubPersonalAccessToken();
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
      return {
        name,
        version: release.tagName,
        versions: releases.map((r) => r.tagName),
      };
    }

    throw Error("There is no release");
  }
}
