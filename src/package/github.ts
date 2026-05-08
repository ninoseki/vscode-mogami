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

    // GitHub Actions can reference a sub-path within a repository
    // (e.g. `github/codeql-action/init`), but the GitHub API only accepts
    // the `owner/repo` portion.
    const repo = name.split('/').slice(0, 2).join('/')

    const getLatestRelease = async () => {
      const data = await this.fetchJson(
        urlJoin(this.source.toString(), 'repos', repo, 'releases', 'latest'),
        { headers },
      )
      return GitHubReleaseSchema.parse(camelcaseKeys(data as object, { deep: true }))
    }

    const getTag = async (tagName: string) => {
      const data = await this.fetchJson(
        urlJoin(this.source.toString(), 'repos', repo, 'git', 'refs', 'tags', tagName),
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
