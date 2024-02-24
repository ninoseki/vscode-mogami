import axios from "axios";
import { setupCache } from "axios-cache-interceptor";
import { ResultAsync } from "neverthrow";

import type { GemType, PypiPackageType } from "@/schemas";
import { GemSchema, PypiPackageSchema } from "@/schemas";

const client = axios.create();

setupCache(client);

export const API = {
  async getPypiPackage(name: string): Promise<PypiPackageType> {
    const res = await client.get(`https://pypi.org/pypi/${name}/json`);
    return PypiPackageSchema.parse(res.data);
  },

  async safeGetPypiPackage(name: string) {
    return await ResultAsync.fromSafePromise(this.getPypiPackage(name));
  },

  async getGem(name: string): Promise<GemType> {
    const res = await client.get(
      `https://rubygems.org/api/v1/gems/${name}.json`,
    );
    return GemSchema.parse(res.data);
  },

  async safeGetGem(name: string) {
    return await ResultAsync.fromSafePromise(this.getGem(name));
  },
};
