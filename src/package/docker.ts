// Tag-comparability logic forked from https://github.com/dependabot/dependabot-core
// (docker/lib/dependabot/docker/tag.rb)
import { z } from 'zod'

import { DependencyType, PackageType } from '@/schemas'
import { urlJoin } from '@/utils'
import { compare } from '@/versioning/utils'

import { AbstractPackageClient } from './abstractClient'

const DOCKER_HUB_API = 'https://hub.docker.com/v2'

const DockerHubTagSchema = z.object({
  name: z.string(),
  last_updated: z.string().nullish(),
})

const DockerHubTagsSchema = z.object({
  results: z.array(DockerHubTagSchema),
})

// Matches the version core (e.g., "1.2.3", "v1.2", "18") together with an
// optional non-numeric prefix (e.g., "v", "jdk-") and suffix (e.g.,
// "-alpine", "-bookworm-slim").
//
// Comparable tags are those that share the same prefix and suffix.
const TAG_PATTERN = /^(?<prefix>\D*)(?<version>\d+(?:[._]\d+)*)(?<suffix>\W.*)?$/

interface TagShape {
  prefix: string
  version: string
  suffix: string
}

export function parseTagShape(name: string): TagShape | undefined {
  const match = TAG_PATTERN.exec(name)
  if (!match || !match.groups) {
    return undefined
  }
  return {
    prefix: match.groups.prefix ?? '',
    version: match.groups.version,
    suffix: match.groups.suffix ?? '',
  }
}

export function tagsAreComparable(a: TagShape, b: TagShape): boolean {
  return a.prefix === b.prefix && a.suffix === b.suffix
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
    const candidates = currentShape
      ? tags.filter((t) => {
          const shape = parseTagShape(t)
          return shape !== undefined && tagsAreComparable(shape, currentShape)
        })
      : tags

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
    const url = `${base}?page_size=100&ordering=last_updated`
    const data = await this.fetchJson(url)
    const parsed = DockerHubTagsSchema.parse(data)
    return parsed.results.map((r) => r.name)
  }
}
