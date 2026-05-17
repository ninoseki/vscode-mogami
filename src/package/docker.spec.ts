import { clearCache } from './cache'
import { DockerClient, isPrereleaseTag, parseTagShape, tagsAreComparable } from './docker'

vi.mock('@/configuration', () => ({
  getShowPrerelease: () => false,
  getUsePrivateSource: () => false,
}))

function mockFetchOnce(body: unknown) {
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

function mockFetchSequence(bodies: unknown[]) {
  const fetchMock = vi.fn<typeof fetch>()
  for (const body of bodies) {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    } as Response)
  }
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function tagsPayload(names: string[]) {
  return { results: names.map((name) => ({ name, last_updated: '2024-01-01' })) }
}

describe('parseTagShape', () => {
  it.each([
    ['18', { prefix: '', version: '18', suffix: '' }],
    ['18-alpine', { prefix: '', version: '18', suffix: '-alpine' }],
    ['10.9.2-alpine', { prefix: '', version: '10.9.2', suffix: '-alpine' }],
    ['v1.2.3', { prefix: 'v', version: '1.2.3', suffix: '' }],
    ['jdk-11-alpine', { prefix: 'jdk-', version: '11', suffix: '-alpine' }],
  ])('parses %s', (name, expected) => {
    expect(parseTagShape(name)).toEqual(expected)
  })

  it('returns undefined for non-versioned tags', () => {
    expect(parseTagShape('latest')).toBeUndefined()
  })
})

describe('tagsAreComparable', () => {
  it('returns true when prefix and suffix match', () => {
    expect(
      tagsAreComparable(
        { prefix: '', version: '18', suffix: '-alpine' },
        { prefix: '', version: '22', suffix: '-alpine' },
      ),
    ).toBe(true)
  })

  it('returns false when suffix differs', () => {
    expect(
      tagsAreComparable(
        { prefix: '', version: '18', suffix: '-alpine' },
        { prefix: '', version: '22', suffix: '-slim' },
      ),
    ).toBe(false)
  })
})

describe('isPrereleaseTag', () => {
  it.each([
    '1.0.0-alpha',
    '1.0.0-ALPHA',
    '1.0.0-beta',
    '1.0.0-rc',
    '1.0.0-rc1',
    '1.0.0-dev',
    '1.0.0-preview',
    'pre-1.0',
    '1.0.0-nightly',
    '1.0.0-snapshot',
    '1.0.0-canary',
    '1.0.0-unstable',
    '3.15.0a2',
    '1.0b1',
    'alpha1',
    'beta2',
    'rc3',
    '1.0.post1',
    '1.0.dev0',
  ])('flags %s as prerelease', (name) => {
    expect(isPrereleaseTag(name)).toBe(true)
  })

  it.each(['1.0.0', '18', '18-alpine', '22-bookworm-slim', 'v1.2.3', '20.04', 'jdk-11-alpine'])(
    'does not flag %s',
    (name) => {
      expect(isPrereleaseTag(name)).toBe(false)
    },
  )
})

describe('DockerClient', () => {
  beforeEach(() => {
    clearCache()
    vi.unstubAllGlobals()
  })

  it('picks the highest tag matching the current tag pattern', async () => {
    const fetchMock = mockFetchOnce(
      tagsPayload([
        '22-alpine',
        '22-bookworm',
        '20-alpine',
        '18-alpine',
        '22',
        '20',
        '18',
        'latest',
      ]),
    )

    const client = new DockerClient()
    const pkg = await client.get('node', { name: 'node', specifier: '18-alpine' })

    expect(pkg.name).toBe('node')
    expect(pkg.version).toBe('22-alpine')
    expect(pkg.versions).toEqual(['18-alpine', '20-alpine', '22-alpine'])
    expect(pkg.format).toBe('dockerfile')
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://hub.docker.com/v2/repositories/library/node/tags/?page_size=100&ordering=last_updated',
    )
  })

  it('uses the library namespace for unqualified image names', async () => {
    const fetchMock = mockFetchOnce(tagsPayload(['22.04', '20.04', '18.04']))
    const client = new DockerClient()
    await client.get('ubuntu', { name: 'ubuntu', specifier: '22.04' })

    expect(fetchMock.mock.calls[0][0]).toContain('/repositories/library/ubuntu/tags/')
  })

  it('keeps the namespace for namespaced images', async () => {
    const fetchMock = mockFetchOnce(tagsPayload(['2.0', '1.0']))
    const client = new DockerClient()
    await client.get('bitnami/postgresql', { name: 'bitnami/postgresql', specifier: '1.0' })

    expect(fetchMock.mock.calls[0][0]).toContain('/repositories/bitnami/postgresql/tags/')
  })

  it('follows the next URL to paginate', async () => {
    const next = 'https://hub.docker.com/v2/repositories/library/node/tags/?page=2'
    const fetchMock = mockFetchSequence([
      { ...tagsPayload(['18-alpine', '20-alpine']), next },
      { ...tagsPayload(['22-alpine']), next: null },
    ])

    const client = new DockerClient()
    const pkg = await client.get('node', { name: 'node', specifier: '18-alpine' })

    expect(pkg.version).toBe('22-alpine')
    expect(pkg.versions).toEqual(['18-alpine', '20-alpine', '22-alpine'])
    expect(fetchMock.mock.calls.length).toBe(2)
    expect(fetchMock.mock.calls[1][0]).toBe(next)
  })

  it('filters prerelease tags by default', async () => {
    mockFetchOnce(tagsPayload(['22-alpine', '20-alpine', '23-alpine-rc1', '24-alpine-beta']))
    const client = new DockerClient()
    const pkg = await client.get('node', { name: 'node', specifier: '20-alpine' })

    expect(pkg.version).toBe('22-alpine')
    expect(pkg.versions).toEqual(['20-alpine', '22-alpine'])
  })

  it('keeps prerelease tags when the current specifier is itself a prerelease', async () => {
    mockFetchOnce(tagsPayload(['1.0.0-alpha', '2.0.0-alpha', '3.0.0-alpha']))
    const client = new DockerClient()
    const pkg = await client.get('foo', { name: 'foo', specifier: '1.0.0-alpha' })

    expect(pkg.version).toBe('3.0.0-alpha')
  })

  it('throws when no compatible tag exists', async () => {
    mockFetchOnce(tagsPayload(['22-slim', '20-slim']))
    const client = new DockerClient()
    await expect(client.get('node', { name: 'node', specifier: '18-alpine' })).rejects.toThrow(
      /No matching tags/,
    )
  })
})
