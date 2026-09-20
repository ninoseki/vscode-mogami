import z from 'zod'

import { DependencyType, PackageType } from '@/schemas'
import { urlJoin } from '@/utils'
import { compare } from '@/versioning/utils'

import { AbstractPackageClient } from './abstractClient'

export const GitHubCommitSchema = z.object({
  sha: z.string(),
})

export const GitHubReleaseSchema = z.object({
  tag_name: z.string(),
  prerelease: z.boolean(),
})

export type GitHubReleaseType = z.infer<typeof GitHubReleaseSchema>

export const GitHubReleasesSchema = z.array(GitHubReleaseSchema)

export const GitHubTagSchema = z.object({
  name: z.string(),
  commit: z.object({ sha: z.string() }),
})

export type GitHubTagType = z.infer<typeof GitHubTagSchema>

export const GitHubTagsSchema = z.array(GitHubTagSchema)

interface GitHubRepoType {
  name: string
  repo: string
  releases: GitHubReleaseType[]
  tags: GitHubTagType[]
}

export class GitHubClient extends AbstractPackageClient<GitHubRepoType> {
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

  private get headers(): Record<string, string> {
    if (!this.gitHubPersonalAccessToken) {
      return {}
    }
    return { authorization: `Bearer ${this.gitHubPersonalAccessToken}` }
  }

  async get(name: string): Promise<GitHubRepoType> {
    // GitHub Actions can reference a sub-path within a repository
    // (e.g. `github/codeql-action/init`), but the GitHub API only accepts
    // the `owner/repo` portion.
    const repo = name.split('/').slice(0, 2).join('/')
    const [releases, tags] = await Promise.all([this.getReleases(repo), this.getTags(repo)])
    return { name, repo, releases, tags }
  }

  async select(
    { name, repo, releases, tags }: GitHubRepoType,
    dependency: DependencyType,
  ): Promise<PackageType> {
    const filtered = this.keepPrereleases(dependency)
      ? releases
      : releases.filter((release) => {
          return !release.prerelease
        })

    const prereleaseOnly = filtered.length === 0 && releases.length > 0
    const candidates = prereleaseOnly ? releases : filtered
    if (candidates.length === 0) {
      throw new Error('No releases found')
    }

    const versions = candidates
      .slice()
      .sort((a, b) => compare(a.tag_name, b.tag_name))
      .map((release) => release.tag_name)
    const version = versions[versions.length - 1]

    const versionByAlias = Object.fromEntries(tags.map((tag) => [tag.commit.sha, tag.name]))
    const aliasByVersion = new Map(tags.map((tag) => [tag.name, tag.commit.sha]))

    // Fall back to /commits/{tag} only when the picked release isn't in the
    // first 100 tags (rare — /tags is ordered newest-first).
    const aliasFromTags = aliasByVersion.get(version)
    const alias =
      aliasFromTags === undefined ? (await this.getCommit(repo, version)).sha : aliasFromTags

    return {
      name,
      version,
      versions,
      prereleaseOnly,
      alias,
      versionByAlias,
      format: 'github-actions-workflow',
    }
  }

  private async getReleases(repo: string): Promise<GitHubReleaseType[]> {
    const data = await this.fetchJson(urlJoin(this.source.toString(), 'repos', repo, 'releases'), {
      headers: this.headers,
    })
    return GitHubReleasesSchema.parse(data)
  }

  private async getTags(repo: string): Promise<GitHubTagType[]> {
    const data = await this.fetchJson(
      urlJoin(this.source.toString(), 'repos', repo, 'tags') + '?per_page=100',
      { headers: this.headers },
    )
    return GitHubTagsSchema.parse(data)
  }

  private async getCommit(repo: string, tagName: string) {
    const data = await this.fetchJson(
      urlJoin(this.source.toString(), 'repos', repo, 'commits', tagName),
      { headers: this.headers },
    )
    return GitHubCommitSchema.parse(data)
  }
}
