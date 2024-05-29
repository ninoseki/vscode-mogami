import { AxiosResponse } from "axios";
import camelcaseKeys from "camelcase-keys";
import * as E from "fp-ts/lib/Either";
import { convert } from "html-to-text";
import { unique } from "radash";
import semver from "semver";
import urlJoin from "url-join";

import { PackageType, PypiPackageSchema } from "@/schemas";

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
  name: string,
): E.Either<unknown, PackageType> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const text = convert(res.data as string);

  const underScoreName = name.replace(/-/g, "_");
  // TODO: not 100% sure whether this trick has 100% coverage
  const regex = new RegExp(
    `^${underScoreName}-(?<version>[^-]+)(\\.tar\\.gz$|-py)`,
  );

  const getVersion = (line: string): string | undefined => {
    const matches = regex.exec(line);
    if (!matches) {
      return undefined;
    }
    const version = matches.groups?.version;
    if (!version) {
      return undefined;
    }
    return version;
  };

  return E.tryCatch(
    () => {
      const versions: string[] = text
        .split("\n")
        .map((line) => line.trim())
        .map((line) => getVersion(line))
        .filter((i): i is Exclude<typeof i, undefined> => i !== undefined)
        // coerce in the filter to support version like 0.6
        .filter((version) => semver.valid(semver.coerce(version)) !== null);

      const coerceCompare = (a: string, b: string) => {
        const a2 = semver.coerce(a) || a;
        const b2 = semver.coerce(b) || b;
        return semver.compare(a2, b2);
      };
      const uniqueSortedVersions = unique(versions).sort(coerceCompare);
      const version = uniqueSortedVersions[uniqueSortedVersions.length - 1];
      if (!version) {
        throw new Error("Failed to parse simple API response");
      }

      return { versions: uniqueSortedVersions, name, version };
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

    const res = await this.client.get(jsonUrl);
    const result = parse(res);
    if (E.isRight(result)) {
      return result.right;
    }

    const resultSimple = parseSimple(res, name);
    if (E.isRight(resultSimple)) {
      return resultSimple.right;
    }

    throw new Error("Failed to parse PyPI API response");
  }
}
