export class HttpError extends Error {
  readonly response: { status: number }

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.response = { status }
  }
}

export function isHttpError(err: unknown): err is HttpError {
  return err instanceof HttpError
}
