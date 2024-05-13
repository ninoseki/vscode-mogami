import camelcaseKeys from "camelcase-keys";

import { PackageType, PypiPackageSchema } from "@/schemas";

import { AbstractPackageClient } from "./abstractClient";

export class PyPIClient extends AbstractPackageClient {
  async get(name: string): Promise<PackageType> {
    const res = await this.client.get(`https://pypi.org/pypi/${name}/json`);
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
  }
}
