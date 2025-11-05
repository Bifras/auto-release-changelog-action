# 🚀 Auto Release & Changelog GitHub Action

GitHub Action to automatically create releases with changelog generated from [Conventional Commits](https://www.conventionalcommits.org/).

## ✨ Features

- ✅ Automatic changelog generation from conventional commits
- ✅ Automatic semver versioning (major/minor/patch)
- ✅ Idempotent GitHub release creation
- ✅ Optional backend SaaS integration for reporting
- ✅ Retry with exponential backoff for external calls
- ✅ Support for changelog-only mode (skip release)

## 📦 Usage

### Basic Example

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      release_type:
        description: 'Release type'
        required: true
        default: 'patch'
        type: choice
        options:
          - major
          - minor
          - patch

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - uses: Bifras/auto-release-changelog-action@v0.1.1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          release-type: ${{ github.event.inputs.release_type }}
```

### With Backend Integration

```yaml
- uses: Bifras/auto-release-changelog-action@v0.1.1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    release-type: 'minor'
    backend-url: ${{ secrets.BACKEND_URL }}
    api-key: ${{ secrets.BACKEND_API_KEY }}
    fail-on-backend-error: false
```

### Changelog Only (No Release)

```yaml
- uses: Bifras/auto-release-changelog-action@v0.1.1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    release-type: 'none'
    changelog-path: 'CHANGELOG.md'
```

## 📝 Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | GitHub token with `contents:write` permission | ✅ | - |
| `release-type` | Version bump type: `major`, `minor`, `patch`, `none` | ❌ | `patch` |
| `changelog-path` | Path to changelog file | ❌ | `CHANGELOG.md` |
| `backend-url` | Backend API URL for reporting | ❌ | - |
| `api-key` | Backend API key | ❌ | - |
| `fail-on-backend-error` | Fail if backend returns error | ❌ | `false` |

## 📤 Outputs

| Output | Description |
|--------|-------------|
| `release-url` | URL of the created release |
| `version` | Calculated version (e.g. `1.2.3`) |
| `tag` | Created tag (e.g. `v1.2.3`) |

## 🔧 Build & Development

### Build Action

```bash
npm install
npm run build
```

This will create the `dist/` folder with the compiled bundle using `@vercel/ncc`.

### Local Testing

```bash
npm test
```

### Test with Act

You can test the action locally using [act](https://github.com/nektos/act):

```bash
act workflow_dispatch -e test-event.json
```

## 📋 Prerequisites

- Repository must use [Conventional Commits](https://www.conventionalcommits.org/)
- `npx` must be available in the runner (default in GitHub Actions)
- `conventional-changelog` will be installed automatically via `npx`

## 🎯 Commit Conventions

The action uses `conventional-changelog` with `angular` preset. Make sure to use commits in the format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Supported types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Refactoring
- `perf`: Performance
- `test`: Test
- `chore`: Maintenance

## 🔒 Security

- ✅ No secrets are logged
- ✅ API keys managed via inputs (not hardcoded)
- ✅ Idempotency: doesn't create duplicate tags
- ✅ Rigorous input validation

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🤝 Contributing

Contributions welcome! Open an issue or pull request.

## 📚 References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions](https://docs.github.com/en/actions)

