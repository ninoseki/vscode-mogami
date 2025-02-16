import { Visitor } from "toml-eslint-parser/lib/traverse";
import { parseYAML, traverseNodes } from "yaml-eslint-parser";
import {
  YAMLMapping,
  YAMLNode,
  YAMLPair,
  YAMLScalar,
} from "yaml-eslint-parser/lib/ast";

import type {
  DependencyType,
  ProjectType,
  RawRangeType,
  TextDocumentLikeType,
} from "@/schemas";

class ShardsYAMLVisitor implements Visitor<YAMLNode> {
  public dependencies: [DependencyType, RawRangeType][] = [];
  public source: string | undefined = undefined;

  public enterNode(node: YAMLNode) {
    const { key } = node as YAMLPair;
    if (key?.type !== "YAMLScalar") {
      return;
    }

    if (
      key.value === "dependencies" ||
      (key.value === "development_dependencies" && node.type === "YAMLPair")
    ) {
      this.parseDependency(node as YAMLPair);
    }
  }

  public leaveNode(): void {}

  private parseDependency(node: YAMLPair): void {
    const value = node.value as YAMLMapping;

    const mapped = value.pairs.map((pair) => {
      if (pair.value?.type !== "YAMLMapping") {
        return;
      }
      const pairs = pair.value.pairs;

      const findByValue = (pair: YAMLPair, value: string): boolean => {
        if (pair.value?.type !== "YAMLScalar") {
          return false;
        }
        return (pair.key as YAMLScalar).value === value;
      };

      const namePair = pairs.find((pair) => findByValue(pair, "github"));
      const name = (namePair?.value as YAMLScalar)?.value;

      const versionPair = pairs.find((pair) => findByValue(pair, "version"));
      const version = (versionPair?.value as YAMLScalar)?.value;

      if (namePair && versionPair && name && version) {
        return [
          {
            name: name.toString(),
            specifier: version.toString(),
            type: "ProjectName",
          },
          [
            pair.loc.start.line - 1,
            pair.loc.start.column,
            pair.loc.end.line - 1,
            pair.loc.end.column,
          ],
        ] as [DependencyType, RawRangeType];
      }
    });

    this.dependencies.push(
      ...mapped.filter(
        (i): i is Exclude<typeof i, undefined> => i !== undefined,
      ),
    );
  }
}

export function parseProject(document: TextDocumentLikeType): ProjectType {
  const visitor = new ShardsYAMLVisitor();
  traverseNodes(parseYAML(document.getText()), visitor);
  const { dependencies } = visitor;
  return {
    dependencies: dependencies,
    format: "shards",
    source: visitor.source,
  };
}
