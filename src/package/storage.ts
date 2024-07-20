import { buildMemoryStorage } from "axios-cache-interceptor";

export const storage = buildMemoryStorage();

export function clearStorage() {
  storage.data = {};
}
