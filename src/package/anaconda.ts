import { AxiosResponse } from "axios";
import camelcaseKeys from "camelcase-keys";
import * as E from "fp-ts/lib/Either";
import urlJoin from "url-join";

import { AnacondaPackageSchema, PackageType } from "@/schemas";

import { AbstractPackageClient } from "./abstractClient";

export function parse(res: AxiosResponse): E.Either<unknown, PackageType> {
  return E.tryCatch(
    () => {
      const parsed = AnacondaPackageSchema.parse(camelcaseKeys(res.data));
      return {
        name: parsed.name,
        version: parsed.latestVersion,
        summary: parsed.summary,
        versions: parsed.versions,
        url: parsed.url || parsed.home || undefined,
      };
    },
    (e: unknown) => e,
  );
}

export class AnacondaClient extends AbstractPackageClient {
  constructor(privateSource?: string) {
    // NOTE: assuming all the packages are from conda-forge
    super("https://api.anaconda.org/package/conda-forge/", privateSource);
  }

  async get(name: string): Promise<PackageType> {
    const res = await this.client.get(urlJoin(this.source.toString(), name));
    const result = parse(res);
    if (E.isRight(result)) {
      return this.normalizePackage(result.right);
    }

    throw new Error("Failed to parse Anaconda API response");
  }
}
