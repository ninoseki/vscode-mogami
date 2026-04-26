import camelcaseKeys from 'camelcase-keys'
import { z } from 'zod'

import { PackageType } from '@/schemas'
import { urlJoin } from '@/utils'

import { AbstractPackageClient } from './abstractClient'

export const AnacondaPackageSchema = z.object({
  name: z.string(),
  summary: z.string().nullish(),
  home: z.string().nullish(),
  url: z.string().nullish(),
  latestVersion: z.string(),
  versions: z.array(z.string()),
})

export type AnacondaPackageType = z.infer<typeof AnacondaPackageSchema>

export function parse(data: unknown) {
  const parsed = AnacondaPackageSchema.parse(camelcaseKeys(data as object))
  return {
    name: parsed.name,
    version: parsed.latestVersion,
    summary: parsed.summary,
    versions: parsed.versions,
    url: parsed.url || parsed.home || undefined,
  }
}

export class AnacondaClient extends AbstractPackageClient {
  constructor(privateSource?: string) {
    // NOTE: assuming all the packages are from conda-forge
    super('https://api.anaconda.org/package/conda-forge/', privateSource)
  }

  async get(name: string): Promise<PackageType> {
    const data = await this.fetchJson(urlJoin(this.source.toString(), name))
    try {
      const result = parse(data)
      return this.normalizePackage(result)
    } catch {
      throw new Error('Failed to parse Anaconda API response')
    }
  }
}
