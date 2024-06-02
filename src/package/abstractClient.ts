import axios, { AxiosInstance } from "axios";
import {
  buildMemoryStorage,
  MemoryStorage,
  setupCache,
} from "axios-cache-interceptor";

import { PackageClientType, PackageType } from "@/schemas";

export abstract class AbstractPackageClient implements PackageClientType {
  client: AxiosInstance;
  storage: MemoryStorage;

  protected _primarySource: URL;
  protected _privateSource?: URL;
  protected _usePrivateSource = false;

  getSource(): URL {
    if (this._usePrivateSource && this._privateSource) {
      return this._privateSource;
    }
    return this._primarySource;
  }

  set usePrivateSource(usePrivateSource: boolean) {
    this._usePrivateSource = usePrivateSource;
  }

  constructor(primarySource: string, privateSource?: string) {
    this.client = axios.create();
    this.storage = buildMemoryStorage();
    setupCache(this.client, { storage: this.storage });

    this._primarySource = new URL(primarySource);
    if (privateSource) {
      this._privateSource = new URL(privateSource);
    }
  }

  abstract get(name: string): Promise<PackageType>;

  clearCache() {
    this.storage.data = {};
  }
}
