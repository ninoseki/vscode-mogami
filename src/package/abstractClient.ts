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
    this.client = setupCache(axios.create(), {
      storage: cache,
      // ignore header based cache control to cache Ruby Gem API responses
      // (ref. https://axios-cache-interceptor.js.org/config#headerinterpreter)
      headerInterpreter: () => "not enough headers",
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
    const versions = this.showPrerelease
      ? pkg.versions
      : pkg.versions.filter((v) => !isPrerelease(v));
    const sortedVersions = versions.sort(compare);
    pkg.version = sortedVersions[sortedVersions.length - 1];
    return pkg;
  }

  clearCache() {
    clearCache();
  }
}
