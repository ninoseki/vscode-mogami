import { LRUCache } from "lru-cache";
import { ResultAsync } from "neverthrow";
import pmap from "p-map";
import vscode from "vscode";

import { Logger } from "@/logger";
import { AnacondaClient } from "@/package/anaconda";
import { GemClient } from "@/package/gem";
import { GitHubClient } from "@/package/github";
import { PyPIClient } from "@/package/pypi";
import type {
  DependencyType,
  PackageClientType,
  PackageType,
  ProjectFormatType,
  ProjectType,
  SatisfiesFnType,
  validateRangeFnType,
} from "@/schemas";
import { getGitHubPersonalAccessToken } from "@/secrets";
import { satisfies as gemSatisfies } from "@/versioning/gem";
import {
  satisfies as pypiSatisfies,
  validateRange as pypiValidateRange,
} from "@/versioning/pypi";
import {
  satisfies as utilsSatisfies,
  validateRange as utilsValidateRange,
} from "@/versioning/utils";

import * as actions from "./actions";
import * as gemfile from "./gemfile";
import * as gemspec from "./gemspec";
import * as pep723 from "./pep723";
import * as pyproject from "./pyproject";
import * as requirements from "./requirements";
import * as shards from "./shards";

type VersionedFileKey = `${string}::${number}`;

const versioningConfig: Record<
  ProjectFormatType,
  { satisfies: SatisfiesFnType; validateRange: validateRangeFnType }
> = {
  gemfile: { satisfies: gemSatisfies, validateRange: utilsValidateRange },
  gemspec: { satisfies: gemSatisfies, validateRange: utilsValidateRange },
  "github-actions-workflow": {
    satisfies: utilsSatisfies,
    validateRange: utilsValidateRange,
  },
  pyproject: { satisfies: pypiSatisfies, validateRange: pypiValidateRange },
  "pip-requirements": {
    satisfies: pypiSatisfies,
    validateRange: pypiValidateRange,
  },
  pep723: { satisfies: pypiSatisfies, validateRange: pypiValidateRange },
  shards: { satisfies: pypiSatisfies, validateRange: pypiValidateRange },
};

const parsers: Record<
  ProjectFormatType,
  (doc: vscode.TextDocument) => ProjectType
> = {
  "pip-requirements": requirements.parseProject,
  pyproject: pyproject.parseProject,
  pep723: pep723.parseProject,
  gemfile: gemfile.parseProject,
  gemspec: gemspec.parseProject,
  "github-actions-workflow": actions.parseProject,
  shards: shards.parseProject,
};

async function createClient(
  context: vscode.ExtensionContext,
  project: ProjectType,
): Promise<PackageClientType> {
  if (project.format === "gemfile" || project.format === "gemspec") {
    return new GemClient(project.source);
  }
  if (project.format === "pyproject" && project.detailedFormat === "pixi") {
    return new AnacondaClient(project.source);
  }
  if (
    project.format === "pyproject" ||
    project.format === "pip-requirements" ||
    project.format === "pep723"
  ) {
    return new PyPIClient(project.source);
  }

  const gitHubPersonalAccessToken = await getGitHubPersonalAccessToken(context);
  if (project.format === "github-actions-workflow") {
    return new GitHubClient(project.source, {
      preserveVersionPrefix: false,
      gitHubPersonalAccessToken,
    });
  }
  // shards
  return new GitHubClient(project.source, {
    preserveVersionPrefix: true,
    gitHubPersonalAccessToken,
  });
}

export class ProjectService {
  public satisfies: SatisfiesFnType;
  public validateRange: validateRangeFnType;
  private client: PackageClientType | undefined;

  constructor(
    private context: vscode.ExtensionContext,
    private project: ProjectType,
    public dependencies: [DependencyType, vscode.Range][],
  ) {
    const config = versioningConfig[project.format];
    this.satisfies = config.satisfies;
    this.validateRange = config.validateRange;
  }

  public getDependencyByPosition(
    position: vscode.Position,
  ): [DependencyType, vscode.Range] | undefined {
    for (const [dependency, range] of this.dependencies) {
      if (range.contains(position)) {
        return [dependency, range];
      }
    }
  }

  private async getClient(): Promise<PackageClientType> {
    if (!this.client) {
      this.client = await createClient(this.context, this.project);
    }
    return this.client;
  }

  public async getPackage(name: string): Promise<PackageType> {
    const client = await this.getClient();
    return await client.get(name);
  }

  async getAllPackageResults({ concurrency }: { concurrency: number }) {
    // NOTE: client may have an error while fetching a package
    //       thus wrap it with ResultAsync (to show an error in CodeLens)
    const names = this.dependencies.map(([dep]) => dep.name);
    const client = await this.getClient();
    const results = names.map(
      (name) => () =>
        ResultAsync.fromPromise(client.get(name), (e: unknown) => e),
    );
    return await pmap(results, async (t) => await t(), { concurrency });
  }
}

// forked from https://github.com/Twixes/pypi-assistant/
export class ProjectParser {
  private cache: LRUCache<string, ProjectType> = new LRUCache({
    max: 30,
  });

  constructor(
    private context: vscode.ExtensionContext,
    public projectFormatType: ProjectFormatType,
  ) {}

  public parse(document: vscode.TextDocument): ProjectService {
    const cacheKey: VersionedFileKey = `${document.uri.toString(true)}::${document.version}`;

    const project =
      this.cache.get(cacheKey) ?? parsers[this.projectFormatType](document);

    Logger.debug(`Project detected: ${project.format}`, {
      detailedFormat: project.detailedFormat,
      source: project.source,
      dependenciesCount: project.dependencies.length,
    });

    this.cache.set(cacheKey, project);

    const dependencies: [DependencyType, vscode.Range][] =
      project.dependencies.map(([dependency, range]) => [
        dependency,
        new vscode.Range(...range),
      ]);

    return new ProjectService(this.context, project, dependencies);
  }

  public clear(): void {
    this.cache.clear();
  }
}
