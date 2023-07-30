import axios from "axios";
import { setupCache } from "axios-cache-interceptor";

import { Gem, PypiPackage } from "@/types";

const client = axios.create();

setupCache(client);

export const API = {
  async getPypiPackage(name: string): Promise<PypiPackage> {
    const res = await client.get<PypiPackage>(
      `https://pypi.org/pypi/${name}/json`,
    );
    return res.data;
  },

  async getGem(name: string): Promise<Gem> {
    const res = await client.get<Gem>(
      `https://rubygems.org/api/v1/gems/${name}.json`,
    );
    return res.data;
  },
};
