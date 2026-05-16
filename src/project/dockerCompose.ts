// Forked from https://github.com/dependabot/dependabot-core
// (docker/lib/dependabot/docker_compose/file_parser.rb)
import { isMap, isScalar, LineCounter, type Node, type Pair, parseDocument } from 'yaml'

import type { DependencyType, ProjectType, RawRangeType, TextDocumentLikeType } from '@/schemas'

// Simplified relative to the OCI spec to avoid catastrophic backtracking:
// separators are collapsed to `[._-]+`, which is a superset of the spec
// (`.`, `_`, `__`, or 1+ `-`s).
const NAME_COMPONENT = String.raw`[a-z\d]+(?:[._-]+[a-z\d]+)*`
const IMAGE_PART = String.raw`(?<image>${NAME_COMPONENT}(?:/${NAME_COMPONENT})*)`

const DOMAIN_LABEL = String.raw`[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?`
const REGISTRY_PART = String.raw`(?<registry>${DOMAIN_LABEL}(?:\.${DOMAIN_LABEL})+(?::\d+)?)`

const TAG_PART = String.raw`:(?<tag>\w[\w.-]{0,127})`
const DIGEST_PART = String.raw`@sha256:(?<digest>[0-9a-f]{64})`

const IMAGE_REGEX = new RegExp(
  `^(?:${REGISTRY_PART}/)?${IMAGE_PART}(?:${TAG_PART})?(?:${DIGEST_PART})?$`,
)

// ${VAR} or ${VAR:-default}
const ENV_VAR = /^\$\{[^}:]+(?::-(?<default>[^}]+))?\}/

interface ParsedImage {
  registry?: string
  image: string
  tag?: string
  digest?: string
}

export function parseImageSpec(raw: string): ParsedImage | undefined {
  // resolve env-var defaults (compose-style `${VAR:-default}`); skip bare `${VAR}` since
  // it has no value to compare against
  let value = raw
  const envMatch = ENV_VAR.exec(raw)
  if (envMatch) {
    if (!envMatch.groups?.default) {
      return undefined
    }
    value = envMatch.groups.default
  }

  const match = IMAGE_REGEX.exec(value)
  if (!match || !match.groups || !match.groups.image) {
    return undefined
  }
  const { registry, image, tag, digest } = match.groups
  return {
    registry: registry && registry !== 'docker.io' ? registry : undefined,
    image,
    tag: tag || undefined,
    digest: digest || undefined,
  }
}

function buildName(parsed: ParsedImage): string {
  return parsed.registry ? `${parsed.registry}/${parsed.image}` : parsed.image
}

function extractImageDependency(
  imagePair: Pair<Node, Node>,
  source: string,
  lineCounter: LineCounter,
): [DependencyType, RawRangeType] | undefined {
  const value = imagePair.value
  if (!isScalar(value) || typeof value.value !== 'string' || !value.range) {
    return undefined
  }

  const parsed = parseImageSpec(value.value)
  if (!parsed) {
    return undefined
  }

  const specifier = parsed.tag ?? (parsed.digest ? `sha256:${parsed.digest}` : undefined)
  if (!specifier) {
    return undefined
  }

  // value.range[1] is the offset just past the value; YAML may include a
  // trailing newline so trim back to the last non-space character.
  let endOffset = value.range[1]
  while (endOffset > value.range[0] && /\s/.test(source[endOffset - 1])) {
    endOffset--
  }

  const start = lineCounter.linePos(value.range[0])
  const end = lineCounter.linePos(endOffset)

  return [
    {
      name: buildName(parsed),
      specifier,
      type: 'ProjectName',
    },
    [start.line - 1, start.col - 1, end.line - 1, end.col - 1],
  ]
}

export function parseProject(document: TextDocumentLikeType): ProjectType {
  const source = document.getText()
  const lineCounter = new LineCounter()
  const doc = parseDocument(source, { lineCounter })
  const dependencies: [DependencyType, RawRangeType][] = []

  const root = doc.contents
  if (!isMap(root)) {
    return { dependencies, format: 'docker-compose' }
  }

  const servicesPair = root.items.find(
    (item) => isScalar(item.key) && item.key.value === 'services',
  )
  if (!servicesPair || !isMap(servicesPair.value)) {
    return { dependencies, format: 'docker-compose' }
  }

  for (const servicePair of servicesPair.value.items) {
    const service = servicePair.value
    if (!isMap(service)) {
      continue
    }

    const imagePair = service.items.find((item) => isScalar(item.key) && item.key.value === 'image')
    if (!imagePair) {
      continue
    }

    const dep = extractImageDependency(imagePair as Pair<Node, Node>, source, lineCounter)
    if (dep) {
      dependencies.push(dep)
    }
  }

  return { dependencies, format: 'docker-compose' }
}
