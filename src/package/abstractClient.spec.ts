import { HttpError } from '@/httpError'
import { PackageType } from '@/schemas'

import { AbstractPackageClient } from './abstractClient'
import { clearCache } from './cache'

vi.mock('@/configuration', () => ({
  getShowPrerelease: () => false,
  getUsePrivateSource: () => false,
}))

class TestClient extends AbstractPackageClient {
  constructor() {
    super('https://example.com/')
  }

  async get(_name: string): Promise<PackageType> {
    throw new Error('not implemented')
  }

  fetchJsonPublic(url: string, options?: { headers?: Record<string, string> }) {
    return this.fetchJson(url, options)
  }

  fetchTextPublic(url: string) {
    return this.fetchText(url)
  }
}

function mockFetch(body: unknown, status = 200) {
  const isString = typeof body === 'string'
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : String(status),
      headers: new Headers(),
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(isString ? body : JSON.stringify(body)),
    }),
  )
}

describe('AbstractPackageClient', () => {
  let client: TestClient

  beforeEach(() => {
    client = new TestClient()
    clearCache()
    vi.unstubAllGlobals()
  })

  describe('fetchJson', () => {
    it('returns parsed JSON from a successful response', async () => {
      mockFetch({ foo: 'bar' })
      expect(await client.fetchJsonPublic('https://example.com/api')).toEqual({ foo: 'bar' })
    })

    it('passes custom headers', async () => {
      mockFetch({})
      await client.fetchJsonPublic('https://example.com/api', {
        headers: { Authorization: 'Bearer token' },
      })
      const [, init] = vi.mocked(fetch).mock.calls[0]
      expect((init!.headers as Headers).get('authorization')).toBe('Bearer token')
    })

    it('throws HttpError on non-ok response', async () => {
      mockFetch('Not Found', 404)
      await expect(client.fetchJsonPublic('https://example.com/api')).rejects.toBeInstanceOf(
        HttpError,
      )
    })
  })

  describe('fetchText', () => {
    it('returns text from a successful response', async () => {
      mockFetch('<html>hello</html>')
      expect(await client.fetchTextPublic('https://example.com/page')).toBe('<html>hello</html>')
    })

    it('throws HttpError on non-ok response', async () => {
      mockFetch('Forbidden', 403)
      await expect(client.fetchTextPublic('https://example.com/page')).rejects.toBeInstanceOf(
        HttpError,
      )
    })
  })
})
