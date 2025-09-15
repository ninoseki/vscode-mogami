// forked from https://github.com/Twixes/pypi-assistant/
import { TOMLKeyValue, TOMLNode, TOMLValue } from "toml-eslint-parser/lib/ast";
import { Visitor } from "toml-eslint-parser/lib/traverse";

import type { DependencyType, RawRangeType } from "@/schemas";

import { parseLineAsDependency } from "./requirements";

export class TOMLVisitor implements Visitor<TOMLNode> {
  public pathStack: (string | number)[] = [];
  public dependencies: [DependencyType, RawRangeType][] = [];
  public source: string | undefined = undefined;

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

      this.potentiallyRegisterUvSourceByIndex(node);
      return;
    }

    if (!this.source && node.type === "TOMLValue") {
      this.potentiallyRegisterUvSourceByIndexUrl(node);
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

  private potentiallyRegisterUvSourceByIndex(node: TOMLKeyValue): void {
    // Check for "tool.uv.index.url"

    if (
      this.pathStack[0] === "tool" &&
      this.pathStack[1] === "uv" &&
      this.pathStack[2] === "index"
    ) {
      const source: string | undefined = (() => {
        const key = node.key.keys[0];
        if ("name" in key && key.name === "url") {
          if (
            node.value.type === "TOMLValue" &&
            typeof node.value.value === "string"
          ) {
            return node.value.value;
          }
        }

        return undefined;
      })();
      if (source && !this.source) {
        this.source = source;
      }
    }
  }

  private potentiallyRegisterUvSourceByIndexUrl(node: TOMLValue): void {
    // check for "tool.uv.index-url"
    if (this.pathStack[0] === "tool" && this.pathStack[1] === "uv") {
      const source: string | undefined = (() => {
        if ((this.pathStack[2] as string) === "index-url") {
          return node.value.toString();
        }
        return undefined;
      })();

      if (source && !this.source) {
        this.source = source;
      }
    }
  }
}
