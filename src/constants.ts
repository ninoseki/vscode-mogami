import * as vscode from "vscode";

import { ProjectFormatType } from "@/schemas";

export const projectFormatsToDocumentSelector = new Map<
  ProjectFormatType[],
  vscode.DocumentSelector
>([
  [
    ["actions"],
    [{ pattern: "**/.github/workflows/*.{yml,yaml}", scheme: "file" }],
  ],
  [["gemspec"], [{ pattern: "**/*.gemspec", scheme: "file" }]],
  [["gemfile"], [{ pattern: "**/Gemfile", scheme: "file" }]],
  [
    ["requirements"],
    [
      {
        pattern:
          "**/{requirements.txt,requirements-*.txt,*-requirements.txt,*.requirements.txt}",
        scheme: "file",
      },
    ],
  ],
  [
    ["uv", "pixi", "poetry", "pyproject"],
    [{ pattern: "**/pyproject.toml", scheme: "file" }],
  ],
]);

export const ExtID = "vscode-mogami";
export const EnableCodeLensKey = "enableCodeLens";
export const ConcurrencyKey = "concurrency";
export const usePrivateSourceKey = "usePrivateSource";
export const showPrerelease = "showPrerelease";
export const gitHubPersonalAccessToken = "gitHubPersonalAccessToken";

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
