# vscode-mogami

A VS Code extension for checking the latest version of each dependency.

[![Version](https://vsmarketplacebadges.dev/version-short/ninoseki.vscode-mogami.svg)](https://marketplace.visualstudio.com/items?itemName=ninoseki.vscode-mogami)
[![Installs](https://vsmarketplacebadges.dev/installs-short/ninoseki.vscode-mogami.svg)](https://marketplace.visualstudio.com/items?itemName=ninoseki.vscode-mogami)
[![Rating](https://vsmarketplacebadges.dev/rating-short/ninoseki.vscode-mogami.svg)](https://marketplace.visualstudio.com/items?itemName=ninoseki.vscode-mogami)

![img](https://raw.githubusercontent.com/ninoseki/vscode-mogami/main/screenshots/1.png)

## Supported Formats

- [Python](#python)
  - [requirements.txt](https://pip.pypa.io/en/stable/reference/requirements-file-format/)
  - `pyproject.toml`:
    - [Poetry](https://python-poetry.org/)
    - [Pixi](https://pixi.sh/)
    - [uv](https://docs.astral.sh/uv/)
    - [PEP 518 and PEP 621](https://packaging.python.org/en/latest/specifications/pyproject-toml/)
- [Ruby](#ruby)
  - `Gemfile`
  - `*.gemspec`
- [GitHub Actions](#github-actions)
  - `.github/workflows/*.{yml,yaml}`

### Python

| Format             | Private Source                                                               |
| ------------------ | ---------------------------------------------------------------------------- |
| `requirements.txt` | `--index-url` is supported.                                                  |
| `pyproject.toml`   | Poetry's `tool.poetry.source` and `uv`'s `tool.uv.index-url` are supported'. |

#### Known Limitations

##### Pixi

All the dependencies in Pixi's `pyproject.toml` are considered as Anaconda packages belong to `conda-forge` (https://anaconda.org/conda-forge).

The following cases are not supported yet:

- Using multiple channels (using a channel except `conda-forge`).
- Using multiple package repositories (using Anaconda and PyPI together).

##### uv & pip's `pyproject.toml`

uv and pip's `pyproject.toml` should have line-break-separated `dependencies` and `optional-dependencies`.

**Good**

```toml
dependencies = [
  "httpx",
  "django>2.1"
]
```

**Bad**

```toml
dependencies = ["httpx", "django>2.1"]
```

##### Authentication / Private Repository

A private repository (source) protected by authentication is not supported.

### Ruby

| Format      | Private Source         |
| ----------- | ---------------------- |
| `Gemfile`   | `source` is supported. |
| `*.gemspec` |                        |

### GitHub Actions

| Format                           | Private Source |
| -------------------------------- | -------------- |
| `.github/workflows/*.{yml,yaml}` |                |

> [!NOTE]
> Mogami uses the GitHub REST API to get release data. The API may block you if you don't set a [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). You can configure it via `vscode-mogami.gitHubPersonalAccessToken`.

## Configuration

| Key                                       | Default | Desc.                                                              |
| ----------------------------------------- | ------- | ------------------------------------------------------------------ |
| `vscode-mogami.concurrency`               | 5       | Concurrency (a number of concurrent requests) to get package data. |
| `vscode-mogami.enableCodeLens`            | `true`  | Whether to enable CodeLens or not.                                 |
| `vscode-mogami.gitHubPersonalAccessToken` | null    | GitHub personal access token for interacting with GitHub REST API. |
| `vscode-mogami.showPrerelease`            | `false` | Whether to show a prerelease version or not.                       |
| `vscode-mogami.usePrivateSource`          | `true`  | Whether to use a private source (repository) if it's set or not.   |

## Alternatives

- [vscode-versionlens](https://gitlab.com/versionlens/vscode-versionlens)
