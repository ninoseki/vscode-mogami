import { buildMemoryStorage } from "axios-cache-interceptor";

export const cache = buildMemoryStorage();

export function clearCache() {
  console.log(cache.data);
  cache.data = {};
  console.log(cache.data);
}
