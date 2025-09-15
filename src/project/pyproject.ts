import { parseTOML, traverseNodes } from "toml-eslint-parser";
import {
  TOMLArray,
  TOMLKeyValue,
  TOMLNode,
  TOMLTable,
} from "toml-eslint-parser/lib/ast";

import type { ProjectType, TextDocumentLikeType } from "@/schemas";

import { TOMLVisitor } from "./common";

class PyprojectTOMLVisitor extends TOMLVisitor {
  public detailedFormat?: string = undefined;

  public enterNode(node: TOMLNode) {
    super.enterNode(node);

    if (node.type === "TOMLTable") {
      this.potentiallyRegisterPoetryDependency(node);
      this.potentiallyRegisterPixiDependency(node);
      return;
    }

    if (node.type === "TOMLKeyValue") {
      this.potentiallyRegisterPoetryDependency(node);
      this.potentiallyRegisterPixiDependency(node);
      if (!this.source) {
        this.potentiallyRegisterPoetrySource(node);
      }
      return;
    }

    if (node.type === "TOMLArray") {
      this.potentiallyRegisterPep631Dependency(node);
      this.potentiallyRegisterPep735Dependency(node);
      this.potentiallyRegisterUvDependency(node);
    }
  }

  private potentiallyRegisterPoetryDependency(
    node: TOMLTable | TOMLKeyValue,
  ): void {
    if (this.pathStack[0] === "tool" && this.pathStack[1] === "poetry") {
      const projectName: string | undefined = (() => {
        if (
          ["dependencies", "dev-dependencies"].includes(
            this.pathStack[2] as string,
          ) &&
          this.pathStack.length === 4 &&
          typeof this.pathStack[3] === "string"
        ) {
          // Basic dependencies and legacy dev dependencies
          return this.pathStack[3];
        }
        if (
          this.pathStack[2] === "group" &&
          this.pathStack[4] === "dependencies" &&
          this.pathStack.length === 6 &&
          typeof this.pathStack[5] === "string"
        ) {
          // Dependency group
          return this.pathStack[5];
        }
      })();

      if (projectName) {
        if (!this.detailedFormat) {
          this.detailedFormat = "poetry";
        }

        this.dependencies.push([
          {
            name: projectName,
            type: "ProjectName",
          },
          [
            node.loc.start.line - 1,
            node.loc.start.column,
            node.loc.end.line - 1,
            node.loc.end.column,
          ],
        ]);
      }
    }
  }

  private potentiallyRegisterPixiDependency(
    node: TOMLTable | TOMLKeyValue,
  ): void {
    if (this.pathStack[0] === "tool" && this.pathStack[1] === "pixi") {
      const projectName: string | undefined = (() => {
        if (
          (this.pathStack[2] as string) === "dependencies" &&
          this.pathStack.length === 4 &&
          typeof this.pathStack[3] === "string"
        ) {
          // Basic dependencies and legacy dev dependencies
          return this.pathStack[3];
        }
        if (
          this.pathStack[2] === "feature" &&
          this.pathStack[4] === "dependencies" &&
          this.pathStack.length === 6 &&
          typeof this.pathStack[5] === "string"
        ) {
          // Dependency group
          return this.pathStack[5];
        }
      })();

      if (projectName) {
        if (!this.detailedFormat) {
          this.detailedFormat = "pixi";
        }

        this.dependencies.push([
          {
            name: projectName,
            type: "ProjectName",
          },
          [
            node.loc.start.line - 1,
            node.loc.start.column,
            node.loc.end.line - 1,
            node.loc.end.column,
          ],
        ]);
      }
    }
  }

  private potentiallyRegisterPep631Dependency(node: TOMLArray): void {
    const isUnderRequiredDependencies =
      this.pathStack.length === 2 &&
      this.pathStack[0] === "project" &&
      this.pathStack[1] === "dependencies";
    const isUnderOptionalDependencies =
      this.pathStack.length === 3 &&
      this.pathStack[0] === "project" &&
      this.pathStack[1] === "optional-dependencies"; // pathStack[2] is arbitrary here - it's the name of the extra
    if (!isUnderRequiredDependencies && !isUnderOptionalDependencies) {
      return;
    }
    this.registerElementsAsDependencies(node.elements);
  }

  private potentiallyRegisterUvDependency(node: TOMLArray): void {
    const isUnderConstraintDependencies =
      this.pathStack.length === 3 &&
      this.pathStack[0] === "tool" &&
      this.pathStack[1] === "uv" &&
      this.pathStack[2] === "constraint-dependencies";
    const isUnderDevDependencies =
      this.pathStack.length === 3 &&
      this.pathStack[0] === "tool" &&
      this.pathStack[1] === "uv" &&
      this.pathStack[2] === "dev-dependencies";
    const isUnderOverrideDependencies =
      this.pathStack.length === 3 &&
      this.pathStack[0] === "tool" &&
      this.pathStack[1] === "uv" &&
      this.pathStack[2] === "override-dependencies";

    if (
      !isUnderConstraintDependencies &&
      !isUnderDevDependencies &&
      !isUnderOverrideDependencies
    ) {
      return;
    }

    if (!this.detailedFormat) {
      this.detailedFormat = "uv";
    }

    this.registerElementsAsDependencies(node.elements);
  }

  private potentiallyRegisterPep735Dependency(node: TOMLArray): void {
    const isUnderDependencyGroups =
      this.pathStack.length === 2 && this.pathStack[0] === "dependency-groups"; // pathStack[1] is arbitrary here - it's the name of the group
    if (!isUnderDependencyGroups) {
      return;
    }
    this.registerElementsAsDependencies(node.elements);
  }

  private potentiallyRegisterPoetrySource(node: TOMLKeyValue): void {
    if (this.pathStack[0] === "tool" && this.pathStack[1] === "poetry") {
      const source: string | undefined = (() => {
        if (
          (this.pathStack[2] as string) === "source" &&
          (this.pathStack[4] as string) === "url"
        ) {
          return "value" in node.value
            ? node.value.value.toString()
            : undefined;
        }
        return undefined;
      })();

      if (source && !this.source) {
        this.source = source;
      }
    }
  }
}

export function parseProject(document: TextDocumentLikeType): ProjectType {
  const visitor = new PyprojectTOMLVisitor();
  traverseNodes(parseTOML(document.getText()), visitor);

  // reject "python" dependency
  const dependencies = visitor.dependencies.filter((item) => {
    const dependency = item[0];
    return dependency.name !== "python";
  });

  return {
    dependencies: dependencies,
    format: "pyproject",
    source: visitor.source,
    detailedFormat: visitor.detailedFormat,
  };
}
