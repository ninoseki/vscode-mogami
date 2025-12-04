import { AxiosResponse } from "axios";
import camelcaseKeys from "camelcase-keys";
import { parseHTML } from "linkedom";
import { unique } from "radash";
import semver from "semver";
import urlJoin from "url-join";
import { ZodError } from "zod";

import { PackageType, PypiPackageSchema } from "@/schemas";
import { compare } from "@/versioning/utils";

import { AbstractPackageClient } from "./abstractClient";

export function parse(res: AxiosResponse): PackageType {
  const { releases, info } = res.data;
  const parsed = PypiPackageSchema.parse({
    info: camelcaseKeys(info, { deep: true }),
    releases,
  });
  const url = [
    parsed.info.homePage,
    parsed.info.projectUrl,
    parsed.info.packageUrl,
  ].find((url): url is Exclude<typeof url, null> => url !== null && url !== "");
  const versions = Object.entries(parsed.releases)
    .map((entry): string | undefined => {
      const version = entry[0];
      const release = entry[1];
      const isYanked = release.some((r) => r.yanked);
      if (isYanked) {
        return undefined;
      }
      return version;
    })
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined);

  return {
    name: parsed.info.name,
    version: parsed.info.version,
    summary: parsed.info.summary,
    versions,
    url,
  };
}

export function parseSimple(res: AxiosResponse, name: string): PackageType {
  const underScoreName = name.replace(/-/g, "_");
  // TODO: not 100% sure whether this trick has 100% coverage
  const regex = new RegExp(
    `^(${underScoreName}|${name})-(?<version>[^-]+)(\\.tar\\.gz$|-py)`,
    "i",
  );

  const getVersion = (value: string): string | undefined => {
    const matches = regex.exec(value);
    if (!matches) {
      return undefined;
    }
    const version = matches.groups?.version;
    if (!version) {
      return undefined;
    }
    return version;
  };

  const { document } = parseHTML(res.data as string);
  const elements = [...document.querySelectorAll("a")];

  const values = elements
    .map((element) => element.textContent)
    .filter((i): i is Exclude<typeof i, null> => i !== null);

  const versions: string[] = values
    .map((value) => value.trim())
    .map((value) => getVersion(value))
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined)
    // coerce in the filter to support version like 0.6
    .filter((version) => semver.valid(semver.coerce(version)) !== null);

  const uniqueSortedVersions = unique(versions).sort(compare);
  const version = uniqueSortedVersions[uniqueSortedVersions.length - 1];
  if (!version) {
    throw new Error("Failed to parse simple API response");
  }

  return { versions: uniqueSortedVersions, name, version };
}

export class PyPIClient extends AbstractPackageClient {
  constructor(privateSource?: string) {
    super("https://pypi.org/pypi/", privateSource);
  }

  async get(name: string): Promise<PackageType> {
    const isSimple = this.source.pathname.includes("/simple");
    const jsonUrl = isSimple
      ? urlJoin(this.source.toString(), name, "/")
      : urlJoin(this.source.toString(), name, "json");

    const res = await this.client.get(jsonUrl);
    try {
      const result = parse(res);
      return this.normalizePackage(result);
    } catch (err) {
      // if it's zod error, try simple parse
      if (err instanceof ZodError) {
        // continue to simple parse
      } else {
        // throw logic error
        throw err;
      }
    }

    try {
      const result = parseSimple(res, name);
      return this.normalizePackage(result);
    } catch {
      throw new Error("Failed to parse PyPI API response");
    }
  }
}
