import axios from "axios";
import { AxiosCacheInstance, setupCache } from "axios-cache-interceptor";

import { getShowPrerelease, getUsePrivateSource } from "@/configuration";
import { PackageClientType, PackageType } from "@/schemas";
import { compare, isPrerelease } from "@/versioning/utils";

import { cache, clearCache } from "./cache";

export abstract class AbstractPackageClient implements PackageClientType {
  client: AxiosCacheInstance;

  private usePrivateSource: boolean;
  private showPrerelease: boolean;
  private primarySource: URL;
  private privateSource?: URL;

  constructor(primarySource: string, privateSource?: string) {
    this.client = setupCache(axios.create({ validateStatus: () => true }), {
      storage: cache,
      cachePredicate: {
        statusCheck: () => true,
      },
    });

    this.primarySource = new URL(primarySource);
    if (privateSource) {
      this.privateSource = new URL(privateSource);
    }

    this.usePrivateSource = getUsePrivateSource();
    this.showPrerelease = getShowPrerelease();
  }

  get source(): URL {
    if (this.usePrivateSource && this.privateSource) {
      return this.privateSource;
    }
    return this.primarySource;
  }

  abstract get(name: string): Promise<PackageType>;

  protected normalizePackage(pkg: PackageType) {
    const sortedVersions = pkg.versions.sort(compare);

    if (this.showPrerelease) {
      // reset the version (= the latest version) with considering prerelease versions
      pkg.version = sortedVersions[sortedVersions.length - 1];
      return pkg;
    }

    // prerelease version can be the latest version if PyPI simple API is used
    if (isPrerelease(pkg.version)) {
      const version = sortedVersions.reverse().find((v) => !isPrerelease(v));
      pkg.version = version || pkg.version;
    }

    return pkg;
  }

  clearCache() {
    clearCache();
  }
}
