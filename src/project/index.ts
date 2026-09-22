import { TTLCache } from '@isaacs/ttlcache'
import { ResultAsync } from 'neverthrow'
import pmap from 'p-map'
import vscode from 'vscode'

import { Logger } from '@/logger'
import { AnacondaClient } from '@/package/anaconda'
import { DockerClient } from '@/package/docker'
import { GemClient } from '@/package/gem'
import { GitHubClient } from '@/package/github'
import { NpmClient } from '@/package/npm'
import { PyPIClient } from '@/package/pypi'
import type {
  DependencyType,
  isValidSpecifierFnType,
  PackageClientType,
  PackageType,
  ProjectFormatType,
  ProjectType,
  SatisfiesFnType,
  validateRangeFnType,
} from '@/schemas'
import { getGitHubPersonalAccessToken } from '@/secrets'
import { satisfies as gemSatisfies } from '@/versioning/gem'
import {
  isValidSpecifier as pypiIsValidSpecifier,
  satisfies as pypiSatisfies,
  validateRange as pypiValidateRange,
} from '@/versioning/pypi'
import {
  isValidSpecifier as utilsIsValidSpecifier,
  satisfies as utilsSatisfies,
  validateRange as utilsValidateRange,
} from '@/versioning/utils'

import * as actions from './actions'
import * as dockerfile from './docker'
import * as dockerCompose from './dockerCompose'
import * as gemfile from './gemfile'
import * as gemspec from './gemspec'
import * as npm from './npm'
import * as preCommit from './preCommit'
import * as pep723 from './python/pep723'
import * as pyproject from './python/pyproject'
import * as requirements from './python/requirements'
import * as shards from './shards'

const versioningConfig: Record<
  ProjectFormatType,
  {
    satisfies: SatisfiesFnType
    validateRange: validateRangeFnType
    isValidSpecifier: isValidSpecifierFnType
  }
> = {
  'docker-compose': {
    satisfies: utilsSatisfies,
    validateRange: utilsValidateRange,
    isValidSpecifier: utilsIsValidSpecifier,
  },
  dockerfile: {
    satisfies: utilsSatisfies,
    validateRange: utilsValidateRange,
    isValidSpecifier: utilsIsValidSpecifier,
  },
  gemfile: {
    satisfies: gemSatisfies,
    validateRange: utilsValidateRange,
    isValidSpecifier: utilsIsValidSpecifier,
  },
  gemspec: {
    satisfies: gemSatisfies,
    validateRange: utilsValidateRange,
    isValidSpecifier: utilsIsValidSpecifier,
  },
  'github-actions-workflow': {
    satisfies: utilsSatisfies,
    validateRange: utilsValidateRange,
    isValidSpecifier: utilsIsValidSpecifier,
  },
  npm: {
    satisfies: utilsSatisfies,
    validateRange: utilsValidateRange,
    isValidSpecifier: utilsIsValidSpecifier,
  },
  pyproject: {
    satisfies: pypiSatisfies,
    validateRange: pypiValidateRange,
    isValidSpecifier: pypiIsValidSpecifier,
  },
  'pre-commit-config': {
    satisfies: utilsSatisfies,
    validateRange: utilsValidateRange,
    isValidSpecifier: utilsIsValidSpecifier,
  },
  'pip-requirements': {
    satisfies: pypiSatisfies,
    validateRange: pypiValidateRange,
    isValidSpecifier: pypiIsValidSpecifier,
  },
  pep723: {
    satisfies: pypiSatisfies,
    validateRange: pypiValidateRange,
    isValidSpecifier: pypiIsValidSpecifier,
  },
  shards: {
    satisfies: pypiSatisfies,
    validateRange: pypiValidateRange,
    isValidSpecifier: pypiIsValidSpecifier,
  },
}

const parsers: Record<ProjectFormatType, (doc: vscode.TextDocument) => ProjectType> = {
  'docker-compose': dockerCompose.parseProject,
  dockerfile: dockerfile.parseProject,
  'pip-requirements': requirements.parseProject,
  pyproject: pyproject.parseProject,
  pep723: pep723.parseProject,
  'pre-commit-config': preCommit.parseProject,
  gemfile: gemfile.parseProject,
  gemspec: gemspec.parseProject,
  'github-actions-workflow': actions.parseProject,
  npm: npm.parseProject,
  shards: shards.parseProject,
}

async function createClient(
  context: vscode.ExtensionContext,
  project: ProjectType,
): Promise<PackageClientType> {
  if (project.format === 'dockerfile' || project.format === 'docker-compose') {
    return new DockerClient(project.source)
  }
  if (project.format === 'gemfile' || project.format === 'gemspec') {
    return new GemClient(project.source)
  }
  if (project.format === 'npm') {
    return new NpmClient(project.source)
  }
  if (project.format === 'pyproject' && project.detailedFormat === 'pixi') {
    return new AnacondaClient(project.source)
  }
  if (
    project.format === 'pyproject' ||
    project.format === 'pip-requirements' ||
    project.format === 'pep723'
  ) {
    return new PyPIClient(project.source)
  }

  const gitHubPersonalAccessToken = await getGitHubPersonalAccessToken(context)
  if (project.format === 'github-actions-workflow') {
    return new GitHubClient(project.source, {
      gitHubPersonalAccessToken,
    })
  }

  // shards and pre-commit configs
  return new GitHubClient(project.source, {
    gitHubPersonalAccessToken,
  })
}

export class ProjectService {
  public satisfies: SatisfiesFnType
  public validateRange: validateRangeFnType
  private isValidSpecifier: isValidSpecifierFnType
  private client: PackageClientType | undefined

  constructor(
    private context: vscode.ExtensionContext,
    private project: ProjectType,
    public dependencies: [DependencyType, vscode.Range][],
  ) {
    const config = versioningConfig[project.format]
    this.satisfies = config.satisfies
    this.validateRange = config.validateRange
    this.isValidSpecifier = config.isValidSpecifier
  }

  public getDependencyByPosition(
    position: vscode.Position,
  ): [DependencyType, vscode.Range] | undefined {
    for (const [dependency, range] of this.dependencies) {
      if (range.contains(position)) {
        return [dependency, range]
      }
    }
  }

  private async getClient(): Promise<PackageClientType> {
    if (!this.client) {
      this.client = await createClient(this.context, this.project)
    }
    return this.client
  }

  public async getPackage(dependency: DependencyType): Promise<PackageType> {
    if (!this.isValidSpecifier(dependency)) {
      throw new Error('invalid version specifier')
    }

    const client = await this.getClient()
    const pkg = await client.resolve(dependency)
    return { ...pkg, format: this.project.format }
  }

  async getAllPackageResults({ concurrency }: { concurrency: number }) {
    await this.getClient()
    const results = this.dependencies.map(
      ([dep]) =>
        () =>
          ResultAsync.fromPromise(this.getPackage(dep), (e: unknown) => e),
    )
    return await pmap(results, async (t) => await t(), { concurrency })
  }
}

// forked from https://github.com/Twixes/pypi-assistant/
export class ProjectParser {
  private cache: TTLCache<string, { version: number; project: ProjectType }> = new TTLCache({
    max: 30,
    ttl: Infinity,
  })

  constructor(
    private context: vscode.ExtensionContext,
    public projectFormatType: ProjectFormatType,
  ) {}

  public parse(document: vscode.TextDocument): ProjectService {
    const project = this.getOrParse(document)

    Logger.debug(`Project detected: ${project.format}`, {
      detailedFormat: project.detailedFormat,
      source: project.source,
      dependenciesCount: project.dependencies.length,
    })

    const dependencies: [DependencyType, vscode.Range][] = project.dependencies.map(
      ([dependency, range]) => [dependency, new vscode.Range(...range)],
    )

    return new ProjectService(this.context, project, dependencies)
  }

  private getOrParse(document: vscode.TextDocument): ProjectType {
    const cacheKey = document.uri.toString(true)

    const cached = this.cache.get(cacheKey)
    if (cached && cached.version === document.version) {
      return cached.project
    }

    const project = parsers[this.projectFormatType](document)
    this.cache.set(cacheKey, { version: document.version, project })
    return project
  }

  public clear(): void {
    this.cache.clear()
  }
}
