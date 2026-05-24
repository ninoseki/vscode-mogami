import { ZodError } from 'zod'

import { clearCache } from './cache'
import { GemClient } from './gem'

vi.mock('@/configuration', () => ({
  getShowPrerelease: () => false,
  getUsePrivateSource: () => false,
}))

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

const gemPayload = {
  version: '7.1.0',
  info: 'Web-application framework',
  homepage_uri: 'https://rubyonrails.org',
}

const versionsPayload = [{ number: '7.0.0' }, { number: '7.1.0' }, { number: '6.1.0' }]

describe('GemClient', () => {
  beforeEach(() => {
    clearCache()
    vi.unstubAllGlobals()
  })

  it('returns the latest version with metadata from both endpoints', async () => {
    const fetchMock = mockFetchSequence([gemPayload, versionsPayload])
    const client = new GemClient()
    const pkg = await client.get('rails')

    expect(pkg.name).toBe('rails')
    expect(pkg.version).toBe('7.1.0')
    expect(pkg.summary).toBe('Web-application framework')
    expect(pkg.url).toBe('https://rubyonrails.org')
    expect(pkg.versions).toEqual(['7.0.0', '7.1.0', '6.1.0'])

    expect(fetchMock.mock.calls[0][0]).toBe('https://rubygems.org/api/v1/gems/rails.json')
    expect(fetchMock.mock.calls[1][0]).toBe('https://rubygems.org/api/v1/versions/rails.json')
  })

  it('throws when the gem response is malformed', async () => {
    mockFetchSequence([{ version: '7.1.0' }, versionsPayload])
    const client = new GemClient()
    await expect(client.get('rails')).rejects.toThrow(ZodError)
  })
})
