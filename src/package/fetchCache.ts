import { HttpError } from '@/httpError'

import { getCacheEntry, setCacheEntry } from './cache'

export async function cachedFetch(
  url: string,
  options: {
    headers?: Record<string, string>
    responseType: 'json' | 'text'
    signal?: AbortSignal
  },
): Promise<NonNullable<unknown>> {
  const cached = getCacheEntry(url)
  if (cached) return cached.data

  const response = await fetch(url, {
    headers: new Headers(options.headers),
    signal: options.signal,
  })

  if (!response.ok) {
    throw new HttpError(response.status, `HTTP ${response.status}: ${response.statusText}`)
  }

  // Always use DEFAULT_TTL regardless of Cache-Control/Expires headers.
  // This mirrors the original axios-cache-interceptor setup:
  //   headerInterpreter: () => 'not enough headers'
  const data: NonNullable<unknown> =
    options.responseType === 'json'
      ? ((await response.json()) as NonNullable<unknown>)
      : await response.text()

  setCacheEntry(url, data)
  return data
}
