import camelcaseKeys from 'camelcase-keys'
import semver from 'semver'
import urlJoin from 'url-join'
import z from 'zod'

import { PackageType } from '@/schemas'

import { AbstractPackageClient } from './abstractClient'

const GitHubTagObjectSchema = z.object({
  sha: z.string(),
})

export const GitHubTagSchema = z.object({
  object: GitHubTagObjectSchema,
})

export type GitHubTagType = z.infer<typeof GitHubTagSchema>

export const GitHubReleaseSchema = z.object({
  tagName: z.string(),
})

export type GitHubReleaseType = z.infer<typeof GitHubReleaseSchema>

export class GitHubClient extends AbstractPackageClient {
  private gitHubPersonalAccessToken: string | undefined = undefined
  private preserveVersionPrefix: boolean

  constructor(
    privateSource?: string,
    {
      preserveVersionPrefix,
      gitHubPersonalAccessToken,
    }: {
      preserveVersionPrefix: boolean
      gitHubPersonalAccessToken?: string
    } = {
      preserveVersionPrefix: true,
    },
  ) {
    super('https://api.github.com', privateSource)
    this.gitHubPersonalAccessToken = gitHubPersonalAccessToken
    this.preserveVersionPrefix = preserveVersionPrefix
  }

  async get(name: string): Promise<PackageType> {
    const headers = (() => {
      if (this.gitHubPersonalAccessToken) {
        return { authorization: `Bearer ${this.gitHubPersonalAccessToken}` }
      }
      return {}
    })()

    const getLatestRelease = async () => {
      const res = await this.client.get(
        urlJoin(this.source.toString(), 'repos', name, 'releases', 'latest'),
        { headers },
      )
      return GitHubReleaseSchema.parse(camelcaseKeys(res.data, { deep: true }))
    }

    const getTag = async (tagName: string) => {
      const res = await this.client.get(
        urlJoin(this.source.toString(), 'repos', name, 'git', 'refs', 'tags', tagName),
        { headers },
      )
      return GitHubTagSchema.parse(res.data)
    }

    const release = await getLatestRelease()
    const tag = await getTag(release.tagName)
    const coerceOrOriginal = (tagName: string): string =>
      // apply coerce if preserveVersionPrefix is true
      this.preserveVersionPrefix ? semver.coerce(tagName)?.version || tagName : tagName

    const version = coerceOrOriginal(release.tagName)
    return {
      name,
      version,
      versions: [version],
      alias: tag.object.sha,
      format: 'github-actions-workflow',
    }
  }
}
