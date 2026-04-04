import { LRUCache } from 'lru-cache'

export interface CacheEntry {
  data: NonNullable<unknown>
  expiresAt: number
}

export const DEFAULT_TTL = 1000 * 60 * 5 // 5 minutes

const lruCache = new LRUCache<string, CacheEntry>({ max: 2048 })

export function getCacheEntry(key: string): CacheEntry | undefined {
  const entry = lruCache.get(key)
  if (entry === undefined || Date.now() >= entry.expiresAt) return undefined
  return entry
}

export function setCacheEntry(key: string, data: NonNullable<unknown>, ttl = DEFAULT_TTL): void {
  lruCache.set(key, { data, expiresAt: Date.now() + ttl })
}

export function clearCache(): void {
  lruCache.clear()
}
