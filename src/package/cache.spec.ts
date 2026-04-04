import { clearCache, getCacheEntry, setCacheEntry } from './cache'

describe('cache', () => {
  beforeEach(() => {
    clearCache()
  })

  it('returns undefined for a missing key', () => {
    expect(getCacheEntry('missing')).toBeUndefined()
  })

  it('stores and retrieves data', () => {
    setCacheEntry('key', { foo: 'bar' })
    expect(getCacheEntry('key')?.data).toEqual({ foo: 'bar' })
  })

  it('overwrites an existing entry', () => {
    setCacheEntry('key', 'first')
    setCacheEntry('key', 'second')
    expect(getCacheEntry('key')?.data).toBe('second')
  })

  it('returns undefined after TTL expires', async () => {
    setCacheEntry('key', 'value', 1) // 1 ms TTL
    await new Promise((r) => setTimeout(r, 10))
    expect(getCacheEntry('key')).toBeUndefined()
  })

  it('clears all entries', () => {
    setCacheEntry('a', 1)
    setCacheEntry('b', 2)
    clearCache()
    expect(getCacheEntry('a')).toBeUndefined()
    expect(getCacheEntry('b')).toBeUndefined()
  })
})
