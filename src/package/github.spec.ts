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

  it('picks the highest released version and resolves its tag SHA', async () => {
    const fetchMock = mockFetchSequence([{ name: 'v2' }, { name: 'v4' }, { name: 'v3' }], {
      object: { sha: 'abc123' },
    })

    const client = new GitHubClient()
    const pkg = await client.get('actions/checkout')

    expect(pkg).toEqual({
      name: 'actions/checkout',
      version: 'v4',
      versions: ['v4'],
      alias: 'abc123',
      format: 'github-actions-workflow',
    })
    expect(fetchMock.mock.calls).toHaveLength(2)
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/actions/checkout/releases',
    )
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://api.github.com/repos/actions/checkout/git/refs/tags/v4',
    )
  })

  it('uses only owner/repo when the action references a sub-path', async () => {
    const fetchMock = mockFetchSequence([{ name: 'v4' }], { object: { sha: 'def456' } })

    const client = new GitHubClient()
    const pkg = await client.get('github/codeql-action/init')

    expect(pkg).toEqual({
      name: 'github/codeql-action/init',
      version: 'v4',
      versions: ['v4'],
      alias: 'def456',
      format: 'github-actions-workflow',
    })
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/github/codeql-action/releases',
    )
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://api.github.com/repos/github/codeql-action/git/refs/tags/v4',
    )
  })

  it('ignores release lines that are not action versions (codeql-action)', async () => {
    // Mirrors github/codeql-action's release list: action releases (vX.Y.Z)
    // coexist with parallel codeql-bundle-* releases. The "latest release"
    // endpoint may surface the bundle, but listing+sorting picks the highest
    // action version.
    mockFetchSequence(
      [
        { name: 'codeql-bundle-v2.25.4' },
        { name: 'v4.35.4' },
        { name: 'v4.35.3' },
        { name: 'v3.29.0' },
      ],
      { object: { sha: 'v4354sha' } },
    )

    const client = new GitHubClient()
    const pkg = await client.get('github/codeql-action/init')

    expect(pkg.version).toBe('v4.35.4')
    expect(pkg.alias).toBe('v4354sha')
  })
})
