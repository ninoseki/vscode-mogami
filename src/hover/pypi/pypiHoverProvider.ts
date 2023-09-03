import * as vscode from "vscode";

import { API } from "@/api";
import { PypiPackage } from "@/types";
import { extractDependency } from "@/utils/pypi";
import { pypiDependencyRegexp } from "@/utils/regexps";

import { AbstractHoverProvider } from "../abstractHoverProvider";

export function buildHoverMessage(pkg: PypiPackage): string {
  const url = (() => {
    // Select URL to display by following the order
    // - home_page
    // - project_url
    // - package_url
    if (pkg.info.home_page !== "") {
      return pkg.info.home_page;
    }
    if (pkg.info.project_url !== "") {
      return pkg.info.project_url;
    }
    return pkg.info.package_url;
  })();

  return `${pkg.info.summary}\n\nLatest version: ${pkg.info.version}\n\n${url}`;
}

export class PypiHoverProvider extends AbstractHoverProvider {
  constructor() {
    const patterns = [
      "**/pyproject.toml",
      "**/*-requirements.txt",
      "**/*.requirements.txt",
      "**/requirements-*.txt",
      "**/requirements.txt",
      "**/requirements/*.txt",
    ];

    super(
      patterns.map((pattern) => {
        return { pattern, scheme: "file" };
      }),
    );
  }

  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ) {
    const range = document.getWordRangeAtPosition(
      position,
      pypiDependencyRegexp,
    );
    const line = document.lineAt(position.line).text.trim();

    const dependency = extractDependency(line);
    if (!dependency) {
      return;
    }

    const pkg = await API.getPypiPackage(dependency.name);
    if (!pkg) {
      return;
    }

    const message = buildHoverMessage(pkg);
    const link = new vscode.Hover(message, range);
    return link;
  }
}
