import { HttpError } from '@/httpError'

import { clearCache, setCacheEntry } from './cache'
import { cachedFetch } from './fetchCache'

function mockFetch(
  body: unknown,
  { status = 200, headers = {} }: { status?: number; headers?: Record<string, string> } = {},
) {
  const isString = typeof body === 'string'
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : String(status),
      headers: new Headers(headers),
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(isString ? body : JSON.stringify(body)),
    }),
  )
}

describe('cachedFetch', () => {
  beforeEach(() => {
    clearCache()
    vi.unstubAllGlobals()
  })

  describe('basic behaviour', () => {
    it('returns parsed JSON', async () => {
      mockFetch({ hello: 'world' })
      expect(await cachedFetch('https://example.com/api', { responseType: 'json' })).toEqual({
        hello: 'world',
      })
    })

    it('returns text', async () => {
      mockFetch('<html/>')
      expect(await cachedFetch('https://example.com/page', { responseType: 'text' })).toBe(
        '<html/>',
      )
    })

    it('throws HttpError on non-ok response', async () => {
      mockFetch('Not Found', { status: 404 })
      await expect(
        cachedFetch('https://example.com/api', { responseType: 'json' }),
      ).rejects.toBeInstanceOf(HttpError)
    })

    it('passes custom headers to fetch', async () => {
      mockFetch({})
      await cachedFetch('https://example.com/api', {
        responseType: 'json',
        headers: { Authorization: 'Bearer token' },
      })
      const [, init] = vi.mocked(fetch).mock.calls[0]
      expect((init!.headers as Headers).get('authorization')).toBe('Bearer token')
    })
  })

  describe('caching', () => {
    it('does not call fetch a second time for a fresh entry', async () => {
      mockFetch({ v: 1 })
      await cachedFetch('https://example.com/cached', { responseType: 'json' })
      await cachedFetch('https://example.com/cached', { responseType: 'json' })
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    })

    it('fetches again after TTL expires', async () => {
      setCacheEntry('https://example.com/expired', { v: 0 }, 1)
      await new Promise((r) => setTimeout(r, 10))

      mockFetch({ v: 1 })
      await cachedFetch('https://example.com/expired', { responseType: 'json' })
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    })

    it('Cache-Control headers are ignored (no-store stays cached)', async () => {
      mockFetch({ v: 1 }, { headers: { 'cache-control': 'no-store' } })
      await cachedFetch('https://example.com/nostore', { responseType: 'json' })

      // second call must not hit the network
      await cachedFetch('https://example.com/nostore', { responseType: 'json' })
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    })
  })
})
