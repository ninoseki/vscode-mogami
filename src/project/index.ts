import * as E from "fp-ts/lib/Either";
import * as path from "path";
import * as vscode from "vscode";

import { Logger } from "@/logger";
import { ProjectType } from "@/schemas";

import * as actions from "./actions";
import * as gemfile from "./gemfile";
import * as gemspec from "./gemspec";
import * as pixi from "./pixi";
import * as poetry from "./poetry";
import * as pyproject from "./pyproject";
import * as requirements from "./requirements";
import * as uv from "./uv";

type IsProjectFnType = (document: vscode.TextDocument) => boolean;
type CreateProjectFnType = (text: string) => ProjectType;

function isGemspecFile(document: vscode.TextDocument): boolean {
  return path.basename(document.fileName).endsWith(".gemspec");
}

function isGemfile(document: vscode.TextDocument): boolean {
  return path.basename(document.fileName) === "Gemfile";
}

function isPyProject(document: vscode.TextDocument): boolean {
  return path.basename(document.fileName) === "pyproject.toml";
}

const isPoetry = isPyProject;
const isUv = isPyProject;
const isPixi = isPyProject;

function isRequirements(document: vscode.TextDocument): boolean {
  return (
    path.basename(document.fileName).includes("requirements") ||
    document.languageId === "pip-requirements"
  );
}

function isActions(document: vscode.TextDocument): boolean {
  return document.languageId === "github-actions-workflow";
}

interface Probe {
  is: IsProjectFnType;
  create: CreateProjectFnType;
}

export const map = new Map<IsProjectFnType, CreateProjectFnType>([
  [isGemspecFile, gemspec.createProject],
  [isGemfile, gemfile.createProject],
  [isActions, actions.createProject],
  [isRequirements, requirements.createProject],
  [isUv, uv.createProject],
  [isPoetry, poetry.createProject],
  [isPixi, pixi.createProject],
  [isPyProject, pyproject.createProject],
]);

const probes: Probe[] = [
  { is: isGemspecFile, create: gemspec.createProject },
  { is: isGemfile, create: gemfile.createProject },
  { is: isActions, create: actions.createProject },
  { is: isRequirements, create: requirements.createProject },
  // NOTE: order matters. it should be (uv, poetry, pixi) > pyproject.
  { is: isUv, create: uv.createProject },
  { is: isPoetry, create: poetry.createProject },
  { is: isPixi, create: pixi.createProject },
  { is: isPyProject, create: pyproject.createProject },
];

export function createProject(document: vscode.TextDocument): ProjectType {
  for (const probe of probes) {
    const result = E.tryCatch(
      () => {
        if (!probe.is(document)) {
          throw new Error("Unsupported project format");
        }
        return probe.create(document.getText());
      },
      (e: unknown) => e,
    );
    if (E.isRight(result)) {
      const project = result.right;
      Logger.debug(
        `Project detected: ${project.format} (${project.dependencies.length} dependencies found)`,
      );
      return project;
    }
  }

  throw new Error("Unsupported format");
}
