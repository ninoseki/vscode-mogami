# vscode-mogami

A VS Code extension for checking the latest version of each dependency.

![img](https://raw.githubusercontent.com/ninoseki/vscode-mogami/main/screenshots/1.png)

## Supported Formats

### Python

- `requirements.txt`
- `pyproject.toml`: [Poetry](https://python-poetry.org/) and pip's [pyproject.toml](https://packaging.python.org/en/latest/specifications/pyproject-toml/)

#### Private Repository

- `requirements.txt`: `--index-url` is supported.
- `pyrpoject..toml`: Poetry's `tool.poetry.source` is supported.

#### Known Limitations

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

- `Gemfile`
- `*.gemspec`

#### Private Repository

- `Gemfile`: `source` is supported.

## Configuration

| Key                            | Default | Desc.                                                              |
| ------------------------------ | ------- | ------------------------------------------------------------------ |
| `vscode-mogami.enableCodeLens` | `true`  | Whether to enable CodeLens or not.                                 |
| `vscode-mogami.concurrency`    | 5       | Concurrency (a number of concurrent requests) to get package data. |

## Alternatives

- [vscode-versionlens](https://gitlab.com/versionlens/vscode-versionlens)
