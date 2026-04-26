import camelcaseKeys from 'camelcase-keys'
import z from 'zod'

import { PackageType } from '@/schemas'
import { urlJoin } from '@/utils'

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

  constructor(
    privateSource?: string,
    {
      gitHubPersonalAccessToken,
    }: {
      gitHubPersonalAccessToken?: string
    } = {},
  ) {
    super('https://api.github.com', privateSource)
    this.gitHubPersonalAccessToken = gitHubPersonalAccessToken
  }

  async get(name: string): Promise<PackageType> {
    const headers: Record<string, string> = {}
    if (this.gitHubPersonalAccessToken) {
      headers.authorization = `Bearer ${this.gitHubPersonalAccessToken}`
    }

    const getLatestRelease = async () => {
      const data = await this.fetchJson(
        urlJoin(this.source.toString(), 'repos', name, 'releases', 'latest'),
        { headers },
      )
      return GitHubReleaseSchema.parse(camelcaseKeys(data as object, { deep: true }))
    }

    const getTag = async (tagName: string) => {
      const data = await this.fetchJson(
        urlJoin(this.source.toString(), 'repos', name, 'git', 'refs', 'tags', tagName),
        { headers },
      )
      return GitHubTagSchema.parse(data)
    }

    const release = await getLatestRelease()
    const tag = await getTag(release.tagName)
    const version = release.tagName

    return {
      name,
      version,
      versions: [version],
      alias: tag.object.sha,
      format: 'github-actions-workflow',
    }
  }
}
