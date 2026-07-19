import { TTLCache } from '@isaacs/ttlcache'

const DEFAULT_TTL = 1000 * 60 * 5 // 5 minutes
const MAX_CACHE_SIZE = 2048

export const cache = new TTLCache<string, unknown>({
  max: MAX_CACHE_SIZE,
  ttl: DEFAULT_TTL,
})

export function clearCache(): void {
  cache.clear()
}
