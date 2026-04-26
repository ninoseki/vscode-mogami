import camelcaseKeys from 'camelcase-keys'
import { parseHTML } from 'linkedom'
import semver from 'semver'
import { ZodError } from 'zod'
import { z } from 'zod'

import { PackageType } from '@/schemas'
import { uniqWith, urlJoin } from '@/utils'
import { compare } from '@/versioning/utils'

import { AbstractPackageClient } from './abstractClient'

export const PypiInfoSchema = z.object({
  name: z.string(),
  summary: z.string().nullish(),
  homePage: z.string().nullish(),
  packageUrl: z.string().nullish(),
  projectUrl: z.string().nullish(),
  version: z.string(),
})

export const PypiPackageReleaseSchema = z.object({
  yanked: z.boolean(),
})

export const PypiPackageSchema = z.object({
  info: PypiInfoSchema,
  releases: z.record(z.string(), z.array(PypiPackageReleaseSchema)),
})

export type PypiPackageType = z.infer<typeof PypiPackageSchema>

export function parse(data: unknown): PackageType {
  const { releases, info } = data as { releases: unknown; info: object }
  const parsed = PypiPackageSchema.parse({
    info: camelcaseKeys(info, { deep: true }),
    releases,
  })
  const url = [parsed.info.homePage, parsed.info.projectUrl, parsed.info.packageUrl].find(
    (url): url is Exclude<typeof url, null> => url !== null && url !== '',
  )
  const versions = Object.entries(parsed.releases)
    .map((entry): string | undefined => {
      const version = entry[0]
      const release = entry[1]
      const isYanked = release.some((r) => r.yanked)
      if (isYanked) {
        return undefined
      }
      return version
    })
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined)

  return {
    name: parsed.info.name,
    version: parsed.info.version,
    summary: parsed.info.summary,
    versions,
    url,
  }
}

export function parseSimple(text: string, name: string): PackageType {
  const underScoreName = name.replace(/-/g, '_')
  // TODO: not 100% sure whether this trick has 100% coverage
  const regex = new RegExp(`^(${underScoreName}|${name})-(?<version>[^-]+)(\\.tar\\.gz$|-py)`, 'i')

  const getVersion = (value: string): string | undefined => {
    const matches = regex.exec(value)
    if (!matches) {
      return undefined
    }
    const version = matches.groups?.version
    if (!version) {
      return undefined
    }
    return version
  }

  const { document } = parseHTML(text)
  const elements = [...document.querySelectorAll('a')]

  const values = elements
    .map((element) => element.textContent)
    .filter((i): i is Exclude<typeof i, null> => i !== null)

  const versions: string[] = values
    .map((value) => value.trim())
    .map((value) => getVersion(value))
    .filter((i): i is Exclude<typeof i, undefined> => i !== undefined)
    // coerce in the filter to support version like 0.6
    .filter((version) => semver.valid(semver.coerce(version)) !== null)

  const uniqueSortedVersions = uniqWith(versions, (a, b) => a === b).sort(compare)
  const version = uniqueSortedVersions[uniqueSortedVersions.length - 1]
  if (!version) {
    throw new Error('Failed to parse simple API response')
  }

  return { versions: uniqueSortedVersions, name, version }
}

export class PyPIClient extends AbstractPackageClient {
  constructor(privateSource?: string) {
    super('https://pypi.org/pypi/', privateSource)
  }

  async get(name: string): Promise<PackageType> {
    const isSimple = this.source.pathname.includes('/simple')
    const url = isSimple
      ? urlJoin(this.source.toString(), name, '/')
      : urlJoin(this.source.toString(), name, 'json')

    const text = await this.fetchText(url)

    try {
      const result = parse(JSON.parse(text))
      return this.normalizePackage(result)
    } catch (err) {
      if (!(err instanceof ZodError) && !(err instanceof SyntaxError)) {
        throw err
      }
    }

    try {
      const result = parseSimple(text, name)
      return this.normalizePackage(result)
    } catch {
      throw new Error('Failed to parse PyPI API response')
    }
  }
}
