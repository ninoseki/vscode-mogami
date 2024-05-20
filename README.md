# vscode-mogami

A VS Code extension for checking the latest version of each dependency.

![img](https://raw.githubusercontent.com/ninoseki/vscode-mogami/main/screenshots/1.png)

## Supported Formats

### Python

- `requirements.txt`
- `pyproject.toml` (Poetry and PEP621)

#### Notes

PEP621's `dependencies` and `optional-dependencies` should be separated by line breaks.

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

## Configuration

| Key                            | Default | Desc.                                                              |
| ------------------------------ | ------- | ------------------------------------------------------------------ |
| `vscode-mogami.enableCodeLens` | `true`  | Whether to enable CodeLens or not.                                 |
| `vscode-mogami.concurrency`    | 5       | Concurrency (a number of concurrent requests) to get package data. |

## Alternatives

- [vscode-versionlens](https://gitlab.com/versionlens/vscode-versionlens)
