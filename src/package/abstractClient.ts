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

  constructor() {
    this.client = axios.create();
    this.storage = buildMemoryStorage();
    setupCache(this.client, { storage: this.storage });
  }

  abstract get(name: string): Promise<PackageType>;

  clearCache() {
    this.storage.data = {};
  }
}
