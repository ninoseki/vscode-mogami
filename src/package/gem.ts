import camelcaseKeys from "camelcase-keys";
import urlJoin from "url-join";

import {
  GemSchema,
  GemVersionsSchema,
  GemVersionsType,
  PackageType,
} from "@/schemas";

import { AbstractPackageClient } from "./abstractClient";

const DEFAULT_SOURCE = "https://rubygems.org";

export class GemClient extends AbstractPackageClient {
  constructor(privateSource?: string) {
    super(DEFAULT_SOURCE, privateSource);
  }

  async get(name: string): Promise<PackageType> {
    const gem = await this.getGem(name);
    const versions = await this.getGemVersions(name);

    gem.versions = versions.map((v) => v.number);

    return gem;
  }

  async getGemVersions(name: string): Promise<GemVersionsType> {
    const source = this.getSource();
    const res = await this.client.get(
      urlJoin(source.toString(), "/api/v1/versions/", `${name}.json`),
    );
    return GemVersionsSchema.parse(res.data);
  }

  async getGem(name: string): Promise<PackageType> {
    const source = this.getSource();
    const res = await this.client.get(
      urlJoin(source.toString(), "/api/v1/gems/", `${name}.json`),
    );
    const parsed = GemSchema.parse(camelcaseKeys(res.data, { deep: true }));
    return {
      name,
      version: parsed.version,
      summary: parsed.info,
      url: parsed.homepageUri,
      versions: [],
    };
  }
}
