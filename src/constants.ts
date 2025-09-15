import { ProjectFormatType } from "@/schemas";

import { Selector } from "./selector";

export const projectFormatToSelector = new Map<ProjectFormatType, Selector>([
  [
    "github-actions-workflow",
    new Selector([
      { pattern: "**/.github/workflows/*.{yml,yaml}", scheme: "file" },
    ]),
  ],
  ["gemspec", new Selector({ pattern: "**/*.gemspec", scheme: "file" })],
  ["gemfile", new Selector({ pattern: "**/Gemfile", scheme: "file" })],
  [
    "pip-requirements",
    new Selector([
      {
        pattern:
          "**/{requirements.txt,requirements-*.txt,*-requirements.txt,*.requirements.txt,constraints.txt}",
        scheme: "file",
      },
    ]),
  ],
  ["pyproject", new Selector({ pattern: "**/pyproject.toml", scheme: "file" })],
  [
    "pep723",
    new Selector(
      { language: "python", scheme: "file" },
      /^#\s*\/\/\/\s*script\s*$/gm,
    ),
  ],
  ["shards", new Selector({ pattern: "**/shard.yml", scheme: "file" })],
]);

export const ExtID = "vscode-mogami";
export const EnableCodeLensKey = "enableCodeLens";
export const ConcurrencyKey = "concurrency";
export const usePrivateSourceKey = "usePrivateSource";
export const showPrerelease = "showPrerelease";

export const GitHubPersonalAccessTokenKey = "gitHubPersonalAccessToken";

export const OnClearCacheKey = "clearCache";
export const OnClearCacheCommand = `${ExtID}.${OnClearCacheKey}`;

export const OnUpdateDependencyClickKey = "suggestions.updateDependencyClick";
export const OnUpdateDependencyClickCommand = `${ExtID}.${OnUpdateDependencyClickKey}`;

export const OnHideClickKey = `icons.hide`;
export const OnHideClickCommand = `${ExtID}.${OnHideClickKey}`;

export const OnShowClickKey = `icons.show`;
export const OnShowClickCommand = `${ExtID}.${OnShowClickKey}`;

export const ProviderActiveStateKey = `${ExtID}.providerActive`;
export const ProviderBusyStateKey = `${ExtID}.providerBusy`;
export const ShowStateKey = `${ExtID}.show`;
