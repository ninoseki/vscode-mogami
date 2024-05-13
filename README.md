# vscode-mogami

A VS Code extension for checking the latest version of each dependency.

![img](https://raw.githubusercontent.com/ninoseki/vscode-mogami/main/screenshots/1.png)

## Supported Formats

### Python

- `requirements.txt`
- `pyproject.toml` (Poetry and Flit)

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
