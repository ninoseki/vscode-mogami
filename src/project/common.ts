// forked from https://github.com/Twixes/pypi-assistant/
import { TOMLNode } from "toml-eslint-parser/lib/ast";
import { Visitor } from "toml-eslint-parser/lib/traverse";

import type { DependencyType, RawRangeType } from "@/schemas";

import { parseLineAsDependency } from "./requirements";

export class TOMLVisitor implements Visitor<TOMLNode> {
  public pathStack: (string | number)[] = [];
  public dependencies: [DependencyType, RawRangeType][] = [];

  public enterNode(node: TOMLNode) {
    if (node.type === "TOMLTable") {
      this.pathStack = node.resolvedKey.slice();
      return;
    }

    if (node.type === "TOMLKeyValue") {
      this.pathStack.push(
        ...node.key.keys.map((key) =>
          "name" in key ? key.name : "value" in key ? key.value : "",
        ),
      );
      return;
    }
  }

  public leaveNode(node: TOMLNode) {
    if (node.type === "TOMLKeyValue") {
      this.pathStack.pop();
    }
  }

  public registerElementsAsDependencies(elements: TOMLNode[]): void {
    for (const elem of elements) {
      if (
        elem.type !== "TOMLValue" ||
        typeof elem.value !== "string" ||
        !elem.value
      ) {
        continue; // Only non-empty strings can be dependency specifiers
      }

      const requirement = parseLineAsDependency(elem.value);
      if (requirement?.type === undefined) {
        continue;
      }

      this.dependencies.push([
        requirement,
        [
          elem.loc.start.line - 1,
          elem.loc.start.column,
          elem.loc.end.line - 1,
          elem.loc.end.column,
        ],
      ]);
    }
  }
}
