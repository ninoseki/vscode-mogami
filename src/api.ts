import axios from "axios";
import { setupCache } from "axios-cache-interceptor";
import camelcaseKeys from "camelcase-keys";
import { tryCatch } from "fp-ts/lib/TaskEither";

import type { PackageType } from "@/schemas";
import { GemSchema, PypiPackageSchema } from "@/schemas";

const client = axios.create();

setupCache(client);

export const API = {
  async getPypiPackage(this: void, name: string): Promise<PackageType> {
    const res = await client.get(`https://pypi.org/pypi/${name}/json`);
    const parsed = PypiPackageSchema.parse(
      camelcaseKeys(res.data, { deep: true }),
    );
    const url = [
      parsed.info.homePage,
      parsed.info.projectUrl,
      parsed.info.packageUrl,
    ].find(
      (url): url is Exclude<typeof url, null> => url !== null && url !== "",
    );
    return {
      name: parsed.info.name,
      version: parsed.info.version,
      summary: parsed.info.summary,
      url,
    };
  },

  safeGetPypiPackage(name: string) {
    return tryCatch(
      () => this.getPypiPackage(name),
      (e: unknown) => e,
    );
  },

  async getGem(this: void, name: string): Promise<PackageType> {
    const res = await client.get(
      `https://rubygems.org/api/v1/gems/${name}.json`,
    );
    const parsed = GemSchema.parse(camelcaseKeys(res.data, { deep: true }));
    return {
      name,
      version: parsed.version,
      summary: parsed.info,
      url: parsed.homepageUri,
    };
  },

  safeGetGem(name: string) {
    return tryCatch(
      () => this.getGem(name),
      (e: unknown) => e,
    );
  },
};
