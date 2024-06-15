# vscode-mogami

A VS Code extension for checking the latest version of each dependency.

![img](https://raw.githubusercontent.com/ninoseki/vscode-mogami/main/screenshots/1.png)

## Supported Formats

### Python

- `requirements.txt`
- `pyproject.toml`:

| Format                                                                                                                                                    | Private Source                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `requirements.txt`                                                                                                                                        | `--index-url` is supported                  |
| `pyproject.toml` ([Poetry](https://python-poetry.org/) and pip's [pyproject.toml](https://packaging.python.org/en/latest/specifications/pyproject-toml/)) | Poetry's `tool.poetry.source` is supported. |

## Known Limitations

pip's `pyproject.toml` should have line-break-separated `dependencies` and `optional-dependencies`.

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

### Ruby

| Format      | Private Source        |
| ----------- | --------------------- |
| `Gemfile`   | `source` is supported |
| `*.gemspec` |                       |

## GitHub Actions

| Format                    | Private Source |
| ------------------------- | -------------- |
| `.github/workflows/*.yml` |                |

## Configuration

| Key                                       | Default | Desc.                                                              |
| ----------------------------------------- | ------- | ------------------------------------------------------------------ |
| `vscode-mogami.concurrency`               | 5       | Concurrency (a number of concurrent requests) to get package data. |
| `vscode-mogami.enableCodeLens`            | `true`  | Whether to enable CodeLens or not.                                 |
| `vscode-mogami.gitHubPersonalAccessToken` | null    | GitHub PAT for interacting with GitHub REST API.                   |
| `vscode-mogami.showPrerelease`            | `false` | Whether to show a prerelease version or not.                       |
| `vscode-mogami.usePrivateSource`          | `true`  | Whether to use a private source (repository) if it's set or not.   |

## Alternatives

- [vscode-versionlens](https://gitlab.com/versionlens/vscode-versionlens)
