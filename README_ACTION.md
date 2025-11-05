# 🚀 Auto Release & Changelog GitHub Action

GitHub Action per creare automaticamente release con changelog generato da [Conventional Commits](https://www.conventionalcommits.org/).

## ✨ Caratteristiche

- ✅ Generazione automatica changelog da conventional commits
- ✅ Calcolo versione semver automatico (major/minor/patch)
- ✅ Creazione release GitHub idempotente
- ✅ Integrazione opzionale con backend SaaS per reporting
- ✅ Retry con exponential backoff per chiamate esterne
- ✅ Supporto per skip release (solo changelog)

## 📦 Utilizzo

### Esempio Base

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      release_type:
        description: 'Tipo di release'
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

      - uses: your-org/auto-release-changelog-action@v0.1.0
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          release-type: ${{ github.event.inputs.release_type }}
```

### Con Backend Integration

```yaml
- uses: your-org/auto-release-changelog-action@v0.1.0
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    release-type: 'minor'
    backend-url: ${{ secrets.BACKEND_URL }}
    api-key: ${{ secrets.BACKEND_API_KEY }}
    fail-on-backend-error: false
```

### Solo Changelog (No Release)

```yaml
- uses: your-org/auto-release-changelog-action@v0.1.0
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    release-type: 'none'
    changelog-path: 'CHANGELOG.md'
```

## 📝 Inputs

| Input | Descrizione | Required | Default |
|-------|-------------|----------|---------|
| `github-token` | GitHub token con permessi per creare release | ✅ | - |
| `release-type` | Tipo di release: `major`, `minor`, `patch`, `none` | ❌ | `patch` |
| `changelog-path` | Path del file CHANGELOG.md | ❌ | `CHANGELOG.md` |
| `backend-url` | URL backend SaaS per reporting | ❌ | - |
| `api-key` | API key per backend | ❌ | - |
| `fail-on-backend-error` | Fallisce action se backend errore | ❌ | `false` |

## 📤 Outputs

| Output | Descrizione |
|--------|-------------|
| `release-url` | URL della release creata |
| `version` | Versione calcolata (es. `1.2.3`) |
| `tag` | Tag creato (es. `v1.2.3`) |

## 🔧 Build e Sviluppo

### Build Action

```bash
npm install
npm run build
```

Questo creerà la cartella `dist/` con il bundle compilato usando `@vercel/ncc`.

### Test Locale

```bash
npm test
```

### Test con Act

Puoi testare l'action localmente usando [act](https://github.com/nektos/act):

```bash
act workflow_dispatch -e test-event.json
```

## 📋 Prerequisiti

- Repository deve usare [Conventional Commits](https://www.conventionalcommits.org/)
- `npx` deve essere disponibile nel runner (default in GitHub Actions)
- `conventional-changelog` verrà installato automaticamente via `npx`

## 🎯 Convenzioni Commit

L'action usa `conventional-changelog` con preset `angular`. Assicurati di usare commit nel formato:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Tipi supportati:
- `feat`: Nuova feature
- `fix`: Bug fix
- `docs`: Documentazione
- `style`: Formattazione
- `refactor`: Refactoring
- `perf`: Performance
- `test`: Test
- `chore`: Manutenzione

## 🔒 Sicurezza

- ✅ Nessun secret viene loggato
- ✅ API keys gestite via inputs (non hardcoded)
- ✅ Idempotenza: non crea tag duplicati
- ✅ Validazione input rigorosa

## 📄 Licenza

MIT License - vedi [LICENSE](LICENSE)

## 🤝 Contributi

Contributi benvenuti! Apri una issue o pull request.

## 📚 Riferimenti

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions](https://docs.github.com/en/actions)

