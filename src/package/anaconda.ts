import { AxiosResponse } from "axios";
import camelcaseKeys from "camelcase-keys";
import urlJoin from "url-join";

import { AnacondaPackageSchema, PackageType } from "@/schemas";

import { AbstractPackageClient } from "./abstractClient";

export function parse(res: AxiosResponse) {
  const parsed = AnacondaPackageSchema.parse(camelcaseKeys(res.data));
  return {
    name: parsed.name,
    version: parsed.latestVersion,
    summary: parsed.summary,
    versions: parsed.versions,
    url: parsed.url || parsed.home || undefined,
  };
}

export class AnacondaClient extends AbstractPackageClient {
  constructor(privateSource?: string) {
    // NOTE: assuming all the packages are from conda-forge
    super("https://api.anaconda.org/package/conda-forge/", privateSource);
  }

  async get(name: string): Promise<PackageType> {
    const res = await this.client.get(urlJoin(this.source.toString(), name));
    try {
      const result = parse(res);
      return this.normalizePackage(result);
    } catch {
      throw new Error("Failed to parse Anaconda API response");
    }
  }
}
