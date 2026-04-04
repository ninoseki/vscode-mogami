import { HttpError, isHttpError } from './httpError'

describe('HttpError', () => {
  it('sets name and response status', () => {
    const err = new HttpError(404, 'not found')
    expect(err.name).toBe('HttpError')
    expect(err.message).toBe('not found')
    expect(err.response.status).toBe(404)
    expect(err).toBeInstanceOf(Error)
  })
})

describe('isHttpError', () => {
  it('returns true for HttpError instances', () => {
    expect(isHttpError(new HttpError(500, 'oops'))).toBe(true)
  })

  it('returns false for plain Error', () => {
    expect(isHttpError(new Error('oops'))).toBe(false)
  })

  it('returns false for non-error values', () => {
    expect(isHttpError('string')).toBe(false)
    expect(isHttpError(null)).toBe(false)
    expect(isHttpError(undefined)).toBe(false)
    expect(isHttpError(404)).toBe(false)
  })
})
