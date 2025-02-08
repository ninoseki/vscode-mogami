import * as E from "fp-ts/lib/Either";
import * as vscode from "vscode";

import { Logger } from "@/logger";
import { ProjectFormatType, ProjectType } from "@/schemas";

import * as actions from "./actions";
import * as gemfile from "./gemfile";
import * as gemspec from "./gemspec";
import * as pixi from "./pixi";
import * as poetry from "./poetry";
import * as pyproject from "./pyproject";
import * as requirements from "./requirements";
import * as uv from "./uv";

type CreateProjectFnType = (text: string) => ProjectType;

interface Probe {
  create: CreateProjectFnType;
  projectFormat: ProjectFormatType;
}

const probes: Probe[] = [
  { create: gemspec.createProject, projectFormat: "gemspec" },
  { create: gemfile.createProject, projectFormat: "gemfile" },
  { create: actions.createProject, projectFormat: "github-actions-workflow" },
  {
    create: requirements.createProject,
    projectFormat: "pip-requirements",
  },
  // order should be poetry > uv > pixi > pyproject, otherwise poetry will be detected as uv
  // (Poetry v2 supports PEP 621 so)
  { create: poetry.createProject, projectFormat: "poetry" },
  { create: uv.createProject, projectFormat: "uv" },
  { create: pixi.createProject, projectFormat: "pixi" },
  { create: pyproject.createProject, projectFormat: "pyproject" },
];

export function createProject(
  document: vscode.TextDocument,
  projectFormats: ProjectFormatType[],
): ProjectType {
  const selectedProbes = probes.filter((probe) =>
    projectFormats.includes(probe.projectFormat),
  );
  for (const probe of selectedProbes) {
    const result = E.tryCatch(
      () => {
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

  throw new Error("Unsupported project format");
}
