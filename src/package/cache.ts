import { buildMemoryStorage } from "axios-cache-interceptor";

export const cache = buildMemoryStorage();

export function clearCache() {
  if (cache.clear) {
    cache.clear();
  }
}
