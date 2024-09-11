import { AnacondaClient } from "@/package/anaconda";
import { GemClient } from "@/package/gem";
import { GitHubClient } from "@/package/github";
import { PyPIClient } from "@/package/pypi";
import { parse as pyPIParse } from "@/project/pypi";
import { nameSpecifierRegexParse } from "@/project/utils";
import {
  PackageClientType,
  ParseFnType,
  ProjectType,
  SatisfiesFnType,
} from "@/schemas";
import { satisfies as gemSatisfies } from "@/versioning/gem";
import { satisfies as pypiSatisfies } from "@/versioning/pypi";
import { satisfies as utilsSatisfies } from "@/versioning/utils";

export class Service {
  project: ProjectType;
  client: PackageClientType;
  parse: ParseFnType;
  satisfies: SatisfiesFnType;

  constructor({
    project,
    client,
    parse,
    satisfies,
  }: {
    project: ProjectType;
    client: PackageClientType;
    parse: ParseFnType;
    satisfies: SatisfiesFnType;
  }) {
    this.project = project;
    this.client = client;
    this.parse = parse;
    this.satisfies = satisfies;
  }
}

function createClient(project: ProjectType): PackageClientType {
  const klass = (() => {
    switch (project.format) {
      case "gemfile":
      case "gemspec":
        return GemClient;
      case "poetry":
      case "pyproject":
      case "pip-requirements":
      case "uv":
        return PyPIClient;
      case "pixi":
        return AnacondaClient;
      case "github-actions-workflow":
        return GitHubClient;
      default:
        throw new Error("Unsupported format");
    }
  })();
  return new klass(project.source);
}

function createParseFn(project: ProjectType): ParseFnType {
  switch (project.format) {
    case "gemfile":
    case "gemspec":
    case "github-actions-workflow":
      return (line: string) => {
        return nameSpecifierRegexParse(line, project.regex);
      };
    case "poetry":
    case "pyproject":
    case "pip-requirements":
    case "uv":
    case "pixi":
      return (line: string) => {
        return pyPIParse(line, project.regex);
      };
    default:
      throw new Error("Unsupported format");
  }
}

function getSatisfiesFn(project: ProjectType): SatisfiesFnType {
  switch (project.format) {
    case "gemfile":
    case "gemspec":
      return gemSatisfies;
    case "github-actions-workflow":
      return utilsSatisfies;
    case "poetry":
    case "pyproject":
    case "pip-requirements":
    case "uv":
    case "pixi":
      return pypiSatisfies;
    default:
      throw new Error("Unsupported format");
  }
}

export function createService(project: ProjectType): Service {
  const client = createClient(project);
  const parse = createParseFn(project);
  const satisfies = getSatisfiesFn(project);
  return { project, client, parse, satisfies };
}
