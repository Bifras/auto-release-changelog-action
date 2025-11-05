# GitHub Marketplace Listing Details

## Listing Information

**Name:** Auto Release & Changelog

**Short Description:** Automatically create GitHub releases with changelog generated from conventional commits

**Full Description:**

GitHub Action to automatically create releases with changelog generated from Conventional Commits.

### Features

- ✅ Automatic changelog generation from conventional commits
- ✅ Automatic semver versioning (major/minor/patch)
- ✅ Idempotent GitHub release creation
- ✅ Optional backend SaaS integration for reporting
- ✅ Retry with exponential backoff for external calls
- ✅ Support for changelog-only mode (skip release)

### Usage

```yaml
- uses: Bifras/auto-release-changelog-action@v0.1.1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    release-type: 'patch'
```

### Requirements

- Repository must use Conventional Commits
- Node.js 18+ in runner

### Documentation

Full documentation available in the README.md file.

**Category:** Developer Tools

**Pricing:** Free

**Installation Instructions:**

1. Add the action to your workflow
2. Ensure your repository uses Conventional Commits
3. Configure the `release-type` input (major/minor/patch)
4. Run the workflow

**Support URL:** https://github.com/Bifras/auto-release-changelog-action/issues

**Repository URL:** https://github.com/Bifras/auto-release-changelog-action

