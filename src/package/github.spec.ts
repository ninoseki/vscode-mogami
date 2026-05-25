import { clearCache } from './cache'
import { GitHubClient } from './github'

vi.mock('@/configuration', () => ({
  getShowPrerelease: () => false,
  getUsePrivateSource: () => false,
}))

function mockFetchSequence(...bodies: unknown[]) {
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

describe('GitHubClient', () => {
  beforeEach(() => {
    clearCache()
    vi.unstubAllGlobals()
  })

  it('picks the highest released version and resolves its tag SHA from /tags', async () => {
    const fetchMock = mockFetchSequence(
      [
        { tag_name: 'v2', prerelease: false },
        { tag_name: 'v4', prerelease: false },
        { tag_name: 'v3', prerelease: false },
      ],
      [
        { name: 'v4', commit: { sha: 'abc123' } },
        { name: 'v3', commit: { sha: 'older' } },
        { name: 'v2', commit: { sha: 'oldest' } },
      ],
    )

    const client = new GitHubClient()
    const pkg = await client.get('actions/checkout')

    expect(pkg).toEqual({
      name: 'actions/checkout',
      version: 'v4',
      versions: ['v4'],
      alias: 'abc123',
      versionByAlias: { abc123: 'v4', older: 'v3', oldest: 'v2' },
      format: 'github-actions-workflow',
    })
    expect(fetchMock.mock.calls).toHaveLength(2)
    const urls = fetchMock.mock.calls.map((c) => c[0]).sort()
    expect(urls).toEqual([
      'https://api.github.com/repos/actions/checkout/releases',
      'https://api.github.com/repos/actions/checkout/tags?per_page=100',
    ])
  })

  it('uses only owner/repo when the action references a sub-path', async () => {
    const fetchMock = mockFetchSequence(
      [{ tag_name: 'v4', prerelease: false }],
      [{ name: 'v4', commit: { sha: 'def456' } }],
    )

    const client = new GitHubClient()
    const pkg = await client.get('github/codeql-action/init')

    expect(pkg).toMatchObject({
      name: 'github/codeql-action/init',
      version: 'v4',
      alias: 'def456',
      versionByAlias: { def456: 'v4' },
    })
    const urls = fetchMock.mock.calls.map((c) => c[0]).sort()
    expect(urls).toEqual([
      'https://api.github.com/repos/github/codeql-action/releases',
      'https://api.github.com/repos/github/codeql-action/tags?per_page=100',
    ])
  })

  it('ignores release lines that are not action versions (codeql-action)', async () => {
    // Mirrors github/codeql-action's release list: action releases (vX.Y.Z)
    // coexist with parallel codeql-bundle-* releases. The "latest release"
    // endpoint may surface the bundle, but listing+sorting picks the highest
    // action version.
    mockFetchSequence(
      [
        { tag_name: 'codeql-bundle-v2.25.4', prerelease: false },
        { tag_name: 'v4.35.4', prerelease: false },
        { tag_name: 'v4.35.3', prerelease: false },
        { tag_name: 'v3.29.0', prerelease: false },
      ],
      [{ name: 'v4.35.4', commit: { sha: 'v4354sha' } }],
    )

    const client = new GitHubClient()
    const pkg = await client.get('github/codeql-action/init')

    expect(pkg.version).toBe('v4.35.4')
    expect(pkg.alias).toBe('v4354sha')
  })

  it('exposes a versionByAlias map keyed by every tag SHA', async () => {
    const latestSha = 'b'.repeat(40)
    const olderSha = 'c'.repeat(40)
    mockFetchSequence(
      [
        { tag_name: 'v5.0.5', prerelease: false },
        { tag_name: 'v5.0.4', prerelease: false },
      ],
      [
        { name: 'v5.0.5', commit: { sha: latestSha } },
        { name: 'v5.0.4', commit: { sha: olderSha } },
      ],
    )

    const client = new GitHubClient()
    const pkg = await client.get('actions/cache')

    expect(pkg.version).toBe('v5.0.5')
    expect(pkg.alias).toBe(latestSha)
    expect(pkg.versionByAlias).toEqual({
      [latestSha]: 'v5.0.5',
      [olderSha]: 'v5.0.4',
    })
  })

  it('falls back to /commits/{tag} when the latest tag is not in the first 100 tags', async () => {
    const fetchMock = mockFetchSequence(
      [{ tag_name: 'v5.0.5', prerelease: false }],
      // /tags returns unrelated tags that don't include v5.0.5
      [{ name: 'other-1', commit: { sha: 'other1sha' } }],
      { sha: 'v505sha' },
    )

    const client = new GitHubClient()
    const pkg = await client.get('actions/cache')

    expect(pkg.alias).toBe('v505sha')
    expect(pkg.versionByAlias).toEqual({ other1sha: 'other-1' })
    expect(fetchMock.mock.calls).toHaveLength(3)
    expect(fetchMock.mock.calls[2][0]).toBe(
      'https://api.github.com/repos/actions/cache/commits/v5.0.5',
    )
  })
})
