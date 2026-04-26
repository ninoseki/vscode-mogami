import { join as joinPath } from 'node:path/posix'

export const uniqWith = <T>(arr: T[], fn: (a: T, b: T) => boolean) =>
  arr.filter((element, index) => arr.findIndex((step) => fn(element, step)) === index)

export const urlJoin = (...args: string[]): string => {
  const [base, ...rest] = args
  const url = new URL(base)
  const trailingSlash = args[args.length - 1].endsWith('/')
  const joined = joinPath(url.pathname, ...rest)
  url.pathname = trailingSlash && !joined.endsWith('/') ? joined + '/' : joined
  return url.toString()
}
