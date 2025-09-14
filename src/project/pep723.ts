import { parseTOML, traverseNodes } from "toml-eslint-parser";
import { TOMLArray, TOMLNode } from "toml-eslint-parser/lib/ast";

import type {
  DependencyType,
  ProjectType,
  RawRangeType,
  TextDocumentLikeType,
} from "@/schemas";

import { TOMLVisitor } from "./common";

export interface Block {
  startLine: number;
  endLine: number;
  raw: string;
}

export function parseMetadataBlock(text: string): Block | undefined {
  const lines = text.split("\n");
  let startLine = -1;
  let endLine = -1;

  // Find start of metadata block
  for (let i = 0; i < lines.length; i++) {
    if (/^#\s*\/\/\/\s*script\s*$/.test(lines[i])) {
      startLine = i;
      break;
    }
  }

  if (startLine === -1) {
    return undefined;
  }

  // Find end of metadata block
  for (let i = startLine + 1; i < lines.length; i++) {
    if (/^#\s*\/\/\/\s*$/.test(lines[i])) {
      endLine = i;
      break;
    }
  }

  if (endLine === -1) {
    return undefined;
  }

  // Extract content lines and remove comment prefixes
  const contentLines: string[] = [];
  for (let i = startLine + 1; i < endLine; i++) {
    const line = lines[i];
    if (!line.startsWith("#")) {
      return undefined; // Invalid format - all lines must be comments
    }
    contentLines.push(line.slice(1).trimStart());
  }

  const raw = lines
    .slice(startLine + 1, endLine)
    .map((line) => line.replace(/^#/, ""))
    .join("\n");

  return {
    startLine,
    endLine,
    raw,
  };
}

class Pep732TOMLVisitor extends TOMLVisitor {
  public enterNode(node: TOMLNode) {
    super.enterNode(node);

    if (node.type === "TOMLArray") {
      this.potentiallyRegisterPep723Dependency(node);
    }
  }

  private potentiallyRegisterPep723Dependency(node: TOMLArray): void {
    if (this.pathStack.length == 1 && this.pathStack[0] === "dependencies") {
      this.registerElementsAsDependencies(node.elements);
    }
  }
}

export function parseProject(document: TextDocumentLikeType): ProjectType {
  const block = parseMetadataBlock(document.getText());
  if (!block) {
    return { dependencies: [], format: "pep723" };
  }

  const visitor = new Pep732TOMLVisitor();
  traverseNodes(parseTOML(block.raw), visitor);

  const dependencies = visitor.dependencies.map(([dep, range]) => {
    const adjustedRange: RawRangeType = [
      // +1 to ignore the header
      range[0] + block.startLine + 1,
      // +1 to ignore the comment (#)
      range[1] + 2,
      // +1 to ignore the footer
      range[2] + block.startLine + 1,
      // +1 to ignore the comment (#)
      range[3] + 2,
    ];
    return [dep, adjustedRange] as [DependencyType, RawRangeType];
  });

  return {
    dependencies: dependencies,
    format: "pep723",
  };
}
