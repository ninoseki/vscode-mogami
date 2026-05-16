// Forked from https://github.com/dependabot/dependabot-core
// (docker/lib/dependabot/docker/file_parser.rb)
import { DockerfileParser } from 'dockerfile-ast'

import type { DependencyType, ProjectType, RawRangeType, TextDocumentLikeType } from '@/schemas'

function buildName(image: string, registry: string | null): string {
  // Docker Hub is the implicit registry; do not prefix it.
  if (registry && registry !== 'docker.io') {
    return `${registry}/${image}`
  }
  return image
}

export function parseProject(document: TextDocumentLikeType): ProjectType {
  const source = document.getText()
  const dockerfile = DockerfileParser.parse(source)
  const dependencies: [DependencyType, RawRangeType][] = []

  for (const from of dockerfile.getFROMs()) {
    const imageName = from.getImageName()
    const imageRange = from.getImageRange()
    if (!imageName || !imageRange) {
      continue
    }

    // tag or digest is required; bare images and build-stage references are skipped
    const tag = from.getImageTag()
    const digest = from.getImageDigest()
    const specifier = tag ?? digest ?? undefined
    if (!specifier) {
      continue
    }

    const dependency: DependencyType = {
      name: buildName(imageName, from.getRegistry()),
      specifier,
      type: 'ProjectName',
    }

    const rawRange: RawRangeType = [
      imageRange.start.line,
      imageRange.start.character,
      imageRange.end.line,
      imageRange.end.character,
    ]

    dependencies.push([dependency, rawRange])
  }

  return {
    dependencies,
    format: 'dockerfile',
  }
}
