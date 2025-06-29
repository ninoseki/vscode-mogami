import { tryCatch } from "fp-ts/TaskEither";
import { LRUCache } from "lru-cache";
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
import * as pyproject from "./pyproject";
import * as requirements from "./requirements";
import * as shards from "./shards";

type VersionedFileKey = `${string}::${number}`;

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
  if (project.format === "pyproject") {
    return new PyPIClient(project.source);
  }
  if (project.format === "pip-requirements") {
    return new PyPIClient(project.source);
  }

  const gitHubPersonalAccessToken = await getGitHubPersonalAccessToken(context);
  if (project.format === "github-actions-workflow") {
    return new GitHubClient(project.source, {
      preserveVersionPrefix: false,
      gitHubPersonalAccessToken,
    });
  }
  if (project.format === "shards") {
    return new GitHubClient(project.source, {
      preserveVersionPrefix: true,
      gitHubPersonalAccessToken,
    });
  }

  throw new Error("Unsupported format");
}

function getSatisfiesFn(project: ProjectType): SatisfiesFnType {
  switch (project.format) {
    case "gemfile":
    case "gemspec":
      return gemSatisfies;
    case "github-actions-workflow":
      return utilsSatisfies;
    case "pyproject":
    case "pip-requirements":
    case "shards":
      return pypiSatisfies;
    default:
      throw new Error("Unsupported format");
  }
}

function getValidateRangeFn(project: ProjectType): validateRangeFnType {
  switch (project.format) {
    case "gemfile":
    case "gemspec":
    case "github-actions-workflow":
      return utilsValidateRange;
    case "pyproject":
    case "pip-requirements":
    case "shards":
      return pypiValidateRange;
    default:
      throw new Error("Unsupported format");
  }
}

export class ProjectService {
  public satisfies: SatisfiesFnType;
  public validateRange: validateRangeFnType;
  private client: PackageClientType | undefined;

  constructor(
    private context: vscode.ExtensionContext,
    private project: ProjectType,
    private dependencies: [DependencyType, vscode.Range][],
  ) {
    this.satisfies = getSatisfiesFn(project);
    this.validateRange = getValidateRangeFn(project);
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
    //       thus wrap it with tryCatch (to show an error in CodeLens)
    const names = this.dependencies.map(([dep]) => dep.name);
    const client = await this.getClient();
    const tasks = names.map((name) =>
      tryCatch(
        () => client.get(name),
        (e: unknown) => e,
      ),
    );
    return await pmap(tasks, (t) => t(), { concurrency });
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

    const project = (() => {
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }
      if (this.projectFormatType === "pip-requirements") {
        return requirements.parseProject(document);
      }
      if (this.projectFormatType === "pyproject") {
        return pyproject.parseProject(document);
      }
      if (this.projectFormatType === "gemfile") {
        return gemfile.parseProject(document);
      }
      if (this.projectFormatType === "gemspec") {
        return gemspec.parseProject(document);
      }
      if (this.projectFormatType === "github-actions-workflow") {
        return actions.parseProject(document);
      }
      if (this.projectFormatType === "shards") {
        return shards.parseProject(document);
      }
    })();

    if (!project) {
      throw new Error("Unsupported project format");
    }

    Logger.debug(
      `Project detected: ${project.format} (${project.dependencies.length} dependencies found), detailed format: ${project.detailedFormat ?? "N/A"}, source: ${project.source ?? "N/A"}`,
    );

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
