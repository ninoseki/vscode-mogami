import { AxiosResponse } from "axios";
import camelcaseKeys from "camelcase-keys";
import * as E from "fp-ts/lib/Either";
import urlJoin from "url-join";

import { PackageType, PypiPackageSchema, PypiSimpleSchema } from "@/schemas";

import { AbstractPackageClient } from "./abstractClient";

export function parse(res: AxiosResponse): E.Either<unknown, PackageType> {
  return E.tryCatch(
    () => {
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
    (e: unknown) => e,
  );
}

export function parseSimple(
  res: AxiosResponse,
): E.Either<unknown, PackageType> {
  return E.tryCatch(
    () => {
      const parsed = PypiSimpleSchema.parse(res.data);
      return {
        name: parsed.name,
        version: parsed.versions[parsed.versions.length - 1],
        versions: parsed.versions,
      };
    },
    (e: unknown) => e,
  );
}

const DEFAULT_SOURCE = "https://pypi.org/pypi/";

export class PyPIClient extends AbstractPackageClient {
  private source: URL;

  constructor(source?: string) {
    super();
    this.source = new URL(source || DEFAULT_SOURCE);
  }

  async get(name: string): Promise<PackageType> {
    const isSimple = this.source.pathname.includes("/simple");
    const jsonUrl = isSimple
      ? urlJoin(this.source.toString(), name, "/")
      : urlJoin(this.source.toString(), name, "json");
    const headers = isSimple
      ? { accept: "application/vnd.pypi.simple.v1+json" }
      : {};

    const res = await this.client.get(jsonUrl, { headers });

    const result = parse(res);
    if (E.isRight(result)) {
      return result.right;
    }

    const resultSimple = parseSimple(res);
    if (E.isRight(resultSimple)) {
      return resultSimple.right;
    }

    throw new Error("Failed to parse PyPI API response");
  }
}
