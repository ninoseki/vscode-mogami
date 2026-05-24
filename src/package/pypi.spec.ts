import { ZodError } from 'zod'

import { clearCache } from './cache'
import { parse, parseSimple, PyPIClient } from './pypi'

vi.mock('@/configuration', () => ({
  getShowPrerelease: () => false,
  getUsePrivateSource: () => false,
}))

function mockFetchText(text: string, status = 200) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : String(status),
    headers: new Headers(),
    text: () => Promise.resolve(text),
    json: () => Promise.resolve(JSON.parse(text)),
  } as Response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const jsonPayload = {
  info: {
    name: 'requests',
    summary: 'HTTP for Humans',
    home_page: 'https://requests.readthedocs.io',
    package_url: 'https://pypi.org/project/requests/',
    project_url: 'https://pypi.org/project/requests/',
    version: '2.32.0',
  },
  releases: {
    '2.31.0': [{ yanked: false }],
    '2.32.0': [{ yanked: false }],
    '2.30.0': [{ yanked: true }],
  },
}

describe('parse', () => {
  it('returns a PackageType from the JSON payload', () => {
    const result = parse(jsonPayload)
    expect(result.name).toBe('requests')
    expect(result.version).toBe('2.32.0')
    expect(result.summary).toBe('HTTP for Humans')
    expect(result.url).toBe('https://requests.readthedocs.io')
    expect(result.versions).toEqual(['2.31.0', '2.32.0'])
  })

  it('filters yanked releases', () => {
    const result = parse(jsonPayload)
    expect(result.versions).not.toContain('2.30.0')
  })

  it('falls back to project_url when home_page is empty', () => {
    const result = parse({
      ...jsonPayload,
      info: { ...jsonPayload.info, home_page: '' },
    })
    expect(result.url).toBe('https://pypi.org/project/requests/')
  })

  it('throws on malformed input', () => {
    expect(() => parse({ info: {} })).toThrow(ZodError)
  })
})

describe('parseSimple', () => {
  const html = `
    <html><body>
      <a href="#">requests-2.31.0.tar.gz</a>
      <a href="#">requests-2.32.0-py3-none-any.whl</a>
      <a href="#">requests-2.32.0.tar.gz</a>
      <a href="#">not-a-package</a>
    </body></html>
  `

  it('extracts unique sorted versions from anchor text', () => {
    const result = parseSimple(html, 'requests')
    expect(result.name).toBe('requests')
    expect(result.version).toBe('2.32.0')
    expect(result.versions).toEqual(['2.31.0', '2.32.0'])
  })

  it('handles underscore-replaced names', () => {
    const underscoreHtml = `
      <html><body>
        <a href="#">my_pkg-1.0.0.tar.gz</a>
        <a href="#">my_pkg-1.1.0.tar.gz</a>
      </body></html>
    `
    const result = parseSimple(underscoreHtml, 'my-pkg')
    expect(result.versions).toEqual(['1.0.0', '1.1.0'])
  })

  it('throws when no versions can be parsed', () => {
    expect(() => parseSimple('<html><body></body></html>', 'requests')).toThrow(
      /Failed to parse simple API response/,
    )
  })
})

describe('PyPIClient', () => {
  beforeEach(() => {
    clearCache()
    vi.unstubAllGlobals()
  })

  it('parses a JSON API response', async () => {
    const fetchMock = mockFetchText(JSON.stringify(jsonPayload))
    const client = new PyPIClient()
    const pkg = await client.get('requests')

    expect(pkg.name).toBe('requests')
    expect(pkg.version).toBe('2.32.0')
    expect(pkg.versions).toEqual(['2.31.0', '2.32.0'])
    expect(fetchMock.mock.calls[0][0]).toBe('https://pypi.org/pypi/requests/json')
  })

  it('falls back to the simple API when JSON parsing fails', async () => {
    const html = `
      <html><body>
        <a href="#">requests-2.31.0.tar.gz</a>
        <a href="#">requests-2.32.0.tar.gz</a>
      </body></html>
    `
    mockFetchText(html)
    const client = new PyPIClient('https://pypi.org/simple/')
    const pkg = await client.get('requests')

    expect(pkg.version).toBe('2.32.0')
    expect(pkg.versions).toEqual(['2.31.0', '2.32.0'])
  })

  it('throws when both parsers fail', async () => {
    mockFetchText('not html or json')
    const client = new PyPIClient()
    await expect(client.get('requests')).rejects.toThrow(/Failed to parse PyPI API response/)
  })
})
