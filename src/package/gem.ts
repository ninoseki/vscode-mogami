import camelcaseKeys from "camelcase-keys";
import urlJoin from "url-join";

import {
  GemSchema,
  GemVersionsSchema,
  GemVersionsType,
  PackageType,
} from "@/schemas";

import { AbstractPackageClient } from "./abstractClient";

export class GemClient extends AbstractPackageClient {
  constructor(privateSource?: string) {
    super("https://rubygems.org", privateSource);
  }

  async get(name: string): Promise<PackageType> {
    const gem = await this.getGem(name);
    const versions = await this.getGemVersions(name);
    gem.versions = versions.map((v) => v.number);
    return this.normalizePackage(gem);
  }

  async getGemVersions(name: string): Promise<GemVersionsType> {
    const res = await this.client.get(
      urlJoin(this.source.toString(), "/api/v1/versions/", `${name}.json`),
    );
    return GemVersionsSchema.parse(res.data);
  }

  async getGem(name: string): Promise<PackageType> {
    const res = await this.client.get(
      urlJoin(this.source.toString(), "/api/v1/gems/", `${name}.json`),
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
