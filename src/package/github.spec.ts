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

  it('fetches release and tag for a simple owner/repo action', async () => {
    const fetchMock = mockFetchSequence(
      { tag_name: 'v4' },
      { object: { sha: 'abc123' } },
    )

    const client = new GitHubClient()
    const pkg = await client.get('actions/checkout')

    expect(pkg).toEqual({
      name: 'actions/checkout',
      version: 'v4',
      versions: ['v4'],
      alias: 'abc123',
      format: 'github-actions-workflow',
    })
    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.github.com/repos/actions/checkout/releases/latest',
    )
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://api.github.com/repos/actions/checkout/git/refs/tags/v4',
    )
  })

  it('uses only owner/repo when the action references a sub-path', async () => {
    const fetchMock = mockFetchSequence(
      { tag_name: 'v4' },
      { object: { sha: 'def456' } },
    )

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
      'https://api.github.com/repos/github/codeql-action/releases/latest',
    )
    expect(fetchMock.mock.calls[1][0]).toBe(
      'https://api.github.com/repos/github/codeql-action/git/refs/tags/v4',
    )
  })
})
