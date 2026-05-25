// Tag-comparability logic forked from https://github.com/dependabot/dependabot-core
// (docker/lib/dependabot/docker/tag.rb)
import { z } from 'zod'

import { DependencyType, PackageType } from '@/schemas'
import { urlJoin } from '@/utils'
import { compare } from '@/versioning/utils'

import { AbstractPackageClient } from './abstractClient'

const DOCKER_HUB_API = 'https://hub.docker.com/v2'
const MAX_PAGINATION_ATTEMPTS = 5

const DockerHubTagSchema = z.object({
  name: z.string(),
  last_updated: z.string().nullish(),
})

const DockerHubTagsSchema = z.object({
  results: z.array(DockerHubTagSchema),
  next: z.string().nullish(),
})

// Matches the version core (e.g., "1.2.3", "v1.2", "18") together with an
// optional non-numeric prefix (e.g., "v", "jdk-") and suffix (e.g.,
// "-alpine", "-bookworm-slim").
//
// Comparable tags are those that share the same prefix and suffix.
const TAG_PATTERN = /^(?<prefix>\D*)(?<version>\d+(?:[._]\d+)*)(?<suffix>\W.*)?$/

const PRERELEASE_PATTERNS: RegExp[] = [
  /alpha/i,
  /beta/i,
  /rc\d*/i,
  /dev/i,
  /preview/i,
  /\bpre\b/i,
  /nightly/i,
  /snapshot/i,
  /canary/i,
  /unstable/i,
  /\d+[a-z]\d*/,
  /[a-z]+\d+$/,
  /\.post\d+/i,
  /\.dev\d+/i,
]

export function isPrereleaseTag(name: string): boolean {
  return PRERELEASE_PATTERNS.some((p) => p.test(name))
}

interface TagShape {
  prefix: string
  version: string
  components: number
  suffix: string
}

export function parseTagShape(name: string): TagShape | undefined {
  const match = TAG_PATTERN.exec(name)
  if (!match || !match.groups) {
    return undefined
  }
  const version = match.groups.version
  return {
    prefix: match.groups.prefix || '',
    version,
    components: version.split(/[._]/).length,
    suffix: match.groups.suffix || '',
  }
}

export function tagsAreComparable(a: TagShape, b: TagShape): boolean {
  if (a.prefix !== b.prefix || a.suffix !== b.suffix) return false
  // When either side uses multi-component versioning (e.g. `1.4.2`) require the same component count.
  // This stops opaque IDs like `5091768` (one component) from sorting above real versions like `1.4.2` (three).
  if (a.components > 1 || b.components > 1) return a.components === b.components
  return true
}

function libraryRepo(name: string): string {
  // Docker Hub treats unqualified images (e.g., "node", "ubuntu") as part of
  // the "library" namespace.
  return name.includes('/') ? name : `library/${name}`
}

export class DockerClient extends AbstractPackageClient {
  constructor(privateSource?: string) {
    super(DOCKER_HUB_API, privateSource)
  }

  async get(name: string, dependency?: DependencyType): Promise<PackageType> {
    const tags = await this.fetchTags(name)

    const specifier = dependency?.specifier
    const currentShape = specifier ? parseTagShape(specifier) : undefined

    // Tags compatible with the current one (same prefix & suffix), or all tags
    // when we don't have a current tag to anchor on.
    const shapeMatched = currentShape
      ? tags.filter((t) => {
          const shape = parseTagShape(t)
          return shape !== undefined && tagsAreComparable(shape, currentShape)
        })
      : tags

    // Keep prerelease tags when the current specifier itself is a prerelease,
    // otherwise drop them unless the user opted in via showPrerelease.
    const keepPrereleases = this.showPrerelease || (specifier ? isPrereleaseTag(specifier) : false)
    const candidates = keepPrereleases
      ? shapeMatched
      : shapeMatched.filter((t) => !isPrereleaseTag(t))

    if (candidates.length === 0) {
      throw new Error('No matching tags found')
    }

    const sorted = candidates.slice().sort(compare)
    const latest = sorted[sorted.length - 1]

    return {
      name,
      version: latest,
      versions: sorted,
      format: 'dockerfile',
    }
  }

  private async fetchTags(name: string): Promise<string[]> {
    const repo = libraryRepo(name)
    const base = urlJoin(this.source.toString(), '/repositories/', repo, '/tags/')
    const tags: string[] = []
    let url: string | undefined = `${base}?page_size=100&ordering=last_updated`

    for (let attempt = 0; attempt < MAX_PAGINATION_ATTEMPTS && url; attempt++) {
      const data = await this.fetchJson(url)
      const parsed = DockerHubTagsSchema.parse(data)
      tags.push(...parsed.results.map((r) => r.name))
      url = parsed.next ?? undefined
    }

    return tags
  }
}
