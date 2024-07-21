import { buildMemoryStorage } from "axios-cache-interceptor";

export const cache = buildMemoryStorage();

export function clearCache() {
  cache.data = {};
}
