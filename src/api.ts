import axios from "axios";
import { setupCache } from "axios-cache-interceptor";
import camelcaseKeys from "camelcase-keys";

import type { GemVersionsType, PackageType } from "@/schemas";
import { GemSchema, GemVersionsSchema, PypiPackageSchema } from "@/schemas";

const client = axios.create();

setupCache(client);

export const API = {
  async getPypiPackage(this: void, name: string): Promise<PackageType> {
    const res = await client.get(`https://pypi.org/pypi/${name}/json`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { releases, info } = res.data;
    const parsed = PypiPackageSchema.parse({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      info: camelcaseKeys(info, { deep: true }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      releases,
    });
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
      versions: Object.keys(parsed.releases),
      url,
    };
  },

  async getGemVersions(this: void, name: string): Promise<GemVersionsType> {
    const res = await client.get(
      `https://rubygems.org/api/v1/versions/${name}.json`,
    );
    return GemVersionsSchema.parse(res.data);
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
      versions: [],
    };
  },
};
