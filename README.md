# vscode-mogami

A VS Code extension for checking the latest version of each dependency.

[![Version](https://vsmarketplacebadges.dev/version-short/ninoseki.vscode-mogami.img)](https://marketplace.visualstudio.com/items?itemName=ninoseki.vscode-mogami)
[![Installs](https://vsmarketplacebadges.dev/installs-short/ninoseki.vscode-mogami.img)](https://marketplace.visualstudio.com/items?itemName=ninoseki.vscode-mogami)
[![Rating](https://vsmarketplacebadges.dev/rating-short/ninoseki.vscode-mogami.img)](https://marketplace.visualstudio.com/items?itemName=ninoseki.vscode-mogami)

![img](https://raw.githubusercontent.com/ninoseki/vscode-mogami/main/screenshots/1.png)

## Supported Formats

- Python:
  - [requirements.txt](https://pip.pypa.io/en/stable/reference/requirements-file-format/)
  - `pyproject.toml`:
    - [Pixi](https://pixi.sh/): `tool.pixi.dependencies` & `tool.pixi.feature.*.dependencies`
    - [Poetry](https://python-poetry.org/): `tool.poetry.dependencies` & `tool.poetry.group.*.dependencies`. `tool.poetry.source`
    - [PyPA](https://packaging.python.org/en/latest/specifications/pyproject-toml/): `project.dependencies`, `project.optional-dependencies` & `dependency-groups`
    - [uv](https://docs.astral.sh/uv/): `tool.uv.constraint-dependencies`, `tool.uv.dev-dependencies` & `tool.uv.override-dependencies`
  - [PEP 723](https://peps.python.org/pep-0723/)
- Ruby:
  - `Gemfile`
  - `*.gemspec`
- GitHub Actions:
  - `.github/workflows/*.{yml,yaml}`
- Crystal Shards:
  - `shard.yml`

## Custom Source

By default, this extension uses a public source (repository) to check package data. The following formats & configurations are supported to change a source to be used.

- Python:
  - [requirements.txt](https://pip.pypa.io/en/stable/reference/requirements-file-format/): `--index-url`
  - `pyproject.toml`:
    - [Poetry](https://python-poetry.org/): `tool.poetry.source`
    - [uv](https://docs.astral.sh/uv/): `tool.uv.index-url`
- Ruby:
  - `Gemfile`: `source`

## Known Limitations

### Pixi

All the dependencies in Pixi's `pyproject.toml` are considered as [conda-forge](https://anaconda.org/conda-forge) packages.

The following cases are not supported yet:

- Using multiple channels (using a channel except `conda-forge`).
- Using multiple package repositories (using Anaconda and PyPI together).

### Crystal Shards

A `github` attributed dependency is supported. `gitlab`, `bitbucket`, etc. are not supported.

## Configuration

| Key                              | Default | Desc.                                                              |
| -------------------------------- | ------- | ------------------------------------------------------------------ |
| `vscode-mogami.concurrency`      | 5       | Concurrency (a number of concurrent requests) to get package data. |
| `vscode-mogami.enableCodeLens`   | `true`  | Whether to enable CodeLens or not.                                 |
| `vscode-mogami.showPrerelease`   | `false` | Whether to show a prerelease version or not.                       |
| `vscode-mogami.usePrivateSource` | `true`  | Whether to use a private source (repository) if it's set or not.   |

> [!NOTE]
> Mogami uses the GitHub REST API to get release data of GitHub Actions Workflow and Crystal Shards. The API may block you if you don't set a [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens). You can configure it via `Set GitHub Personal Access Token` command.

## Alternatives

- [vscode-versionlens](https://gitlab.com/versionlens/vscode-versionlens)
- [pypi-assistant](https://github.com/Twixes/pypi-assistant)
