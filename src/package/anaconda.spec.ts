import { ZodError } from 'zod'

import { AnacondaClient, parse } from './anaconda'
import { clearCache } from './cache'

vi.mock('@/configuration', () => ({
  getShowPrerelease: () => false,
  getUsePrivateSource: () => false,
}))

function mockFetchOnce(body: unknown, status = 200) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : String(status),
    headers: new Headers(),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const validPayload = {
  name: 'numpy',
  summary: 'Array computing',
  home: 'https://numpy.org',
  url: 'https://anaconda.org/conda-forge/numpy',
  latest_version: '2.0.0',
  versions: ['1.26.0', '2.0.0'],
}

describe('parse', () => {
  it('maps snake_case fields onto the PackageType shape', () => {
    expect(parse(validPayload)).toEqual({
      name: 'numpy',
      version: '2.0.0',
      summary: 'Array computing',
      versions: ['1.26.0', '2.0.0'],
      url: 'https://anaconda.org/conda-forge/numpy',
    })
  })

  it('falls back to home when url is empty', () => {
    expect(parse({ ...validPayload, url: '' }).url).toBe('https://numpy.org')
  })

  it('returns undefined url when both url and home are missing', () => {
    expect(parse({ ...validPayload, url: null, home: null }).url).toBeUndefined()
  })

  it('throws on malformed input', () => {
    expect(() => parse({ name: 'numpy' })).toThrow(ZodError)
  })
})

describe('AnacondaClient', () => {
  beforeEach(() => {
    clearCache()
    vi.unstubAllGlobals()
  })

  it('fetches a package and returns the latest version', async () => {
    const fetchMock = mockFetchOnce(validPayload)
    const client = new AnacondaClient()
    const pkg = await client.get('numpy')

    expect(pkg.name).toBe('numpy')
    expect(pkg.version).toBe('2.0.0')
    expect(pkg.summary).toBe('Array computing')
    expect(pkg.versions).toEqual(['1.26.0', '2.0.0'])
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.anaconda.org/package/conda-forge/numpy')
  })

  it('throws when the API response is malformed', async () => {
    mockFetchOnce({ name: 'numpy' })
    const client = new AnacondaClient()
    await expect(client.get('numpy')).rejects.toThrow(/Failed to parse Anaconda API response/)
  })
})
