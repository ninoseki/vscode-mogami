import { clearCache } from './cache'
import { NpmClient } from './npm'

vi.mock('@/configuration', () => ({
  getShowPrerelease: () => false,
  getUsePrivateSource: () => false,
}))

function mockFetchJson(body: unknown) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const npmPayload = {
  name: 'foo',
  description: 'A package',
  'dist-tags': { latest: '2.0.0' },
  versions: {
    '1.0.0': { deprecated: 'Use 2.x instead' },
    '1.1.0': { deprecated: true },
    '2.0.0': {},
  },
  homepage: 'https://example.com',
}

describe('NpmClient', () => {
  beforeEach(() => {
    clearCache()
    vi.unstubAllGlobals()
  })

  it('collects deprecated versions', async () => {
    mockFetchJson(npmPayload)
    const pkg = await new NpmClient().get('foo')
    expect(pkg.versions).toEqual(['1.0.0', '1.1.0', '2.0.0'])
    expect(pkg.deprecatedVersions).toEqual(['1.0.0', '1.1.0'])
  })

  it('keeps deprecated versions after select', async () => {
    mockFetchJson(npmPayload)
    const pkg = await new NpmClient().resolve({ name: 'foo', specifier: '1.0.0' })
    expect(pkg.version).toBe('2.0.0')
    expect(pkg.deprecatedVersions).toEqual(['1.0.0', '1.1.0'])
  })
})
