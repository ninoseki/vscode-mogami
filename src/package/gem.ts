import camelcaseKeys from 'camelcase-keys'
import urlJoin from 'url-join'
import { z } from 'zod'

import { PackageType } from '@/schemas'

import { AbstractPackageClient } from './abstractClient'

export const GemVersionSchema = z.object({
  number: z.string(),
})

export const GemVersionsSchema = z.array(GemVersionSchema)

export type GemVersionsType = z.infer<typeof GemVersionsSchema>

export const GemSchema = z.object({
  version: z.string(),
  info: z.string(),
  homepageUri: z.string(),
})

export const GemPackageSchema = z.object({
  name: z.string(),
  requirements: z.string().nullish(),
})

export type GemType = z.infer<typeof GemSchema>
export type GemPackageType = z.infer<typeof GemPackageSchema>

export class GemClient extends AbstractPackageClient {
  constructor(privateSource?: string) {
    super('https://rubygems.org', privateSource)
  }

  async get(name: string): Promise<PackageType> {
    const gem = await this.getGem(name)
    const versions = await this.getGemVersions(name)
    gem.versions = versions.map((v) => v.number)
    return this.normalizePackage(gem)
  }

  async getGemVersions(name: string): Promise<GemVersionsType> {
    const data = await this.fetchJson(
      urlJoin(this.source.toString(), '/api/v1/versions/', `${name}.json`),
    )
    return GemVersionsSchema.parse(data)
  }

  async getGem(name: string): Promise<PackageType> {
    const data = await this.fetchJson(
      urlJoin(this.source.toString(), '/api/v1/gems/', `${name}.json`),
    )
    const parsed = GemSchema.parse(camelcaseKeys(data as object, { deep: true }))
    return {
      name,
      version: parsed.version,
      summary: parsed.info,
      url: parsed.homepageUri,
      versions: [],
    }
  }
}
