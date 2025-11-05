/**
 * Auto Release & Changelog GitHub Action
 * 
 * Autore: Auto-generated
 * Data: 2025-01-28
 * Scopo: Crea automaticamente release GitHub con changelog generato da conventional commits.
 *        Supporta integrazione opzionale con backend SaaS per reporting.
 */

const core = require('@actions/core');
const github = require('@actions/github');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

/**
 * Sleep utility per retry con backoff
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry con exponential backoff
 * @param {Function} fn - Funzione da eseguire
 * @param {number} maxRetries - Numero massimo di tentativi
 * @param {number} baseDelay - Delay base in ms
 */
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        core.info(`Tentativo ${attempt + 1} fallito, retry tra ${delay}ms...`);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

/**
 * Esegue comando shell e ritorna output
 */
function execCommand(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    return output ? output.toString().trim() : '';
  } catch (error) {
    core.warn(`Comando fallito: ${command}`);
    throw error;
  }
}

/**
 * Verifica se tag esiste già
 */
async function tagExists(octokit, owner, repo, tag) {
  try {
    await octokit.rest.repos.getReleaseByTag({ owner, repo, tag });
    return true;
  } catch (error) {
    if (error.status === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Ottiene l'ultimo tag dal repository
 */
async function getLatestTag(octokit, owner, repo) {
  try {
    const { data: tags } = await octokit.rest.repos.listTags({
      owner,
      repo,
      per_page: 1
    });

    if (tags.length === 0) {
      core.info('Nessun tag trovato nel repository');
      return null;
    }

    const latestTag = tags[0].name.replace(/^v/, ''); // Rimuove prefisso 'v'
    core.info(`Ultimo tag trovato: ${tags[0].name}`);
    return latestTag;
  } catch (error) {
    core.warn(`Errore nel recupero tag: ${error.message}`);
    return null;
  }
}

/**
 * Calcola prossima versione basata su release-type
 */
function calculateNextVersion(latestTag, releaseType) {
  if (!latestTag || !semver.valid(latestTag)) {
    // Se non c'è tag valido, parte da 0.1.0
    core.info('Nessun tag semver valido trovato, partendo da 0.1.0');
    return '0.1.0';
  }

  const nextVersion = semver.inc(latestTag, releaseType);
  if (!nextVersion) {
    throw new Error(`Impossibile calcolare versione ${releaseType} da ${latestTag}`);
  }

  return nextVersion;
}

/**
 * Genera/aggiorna CHANGELOG.md usando conventional-changelog
 */
function generateChangelog(changelogPath) {
  core.info(`Generazione changelog in ${changelogPath}...`);

  // Verifica se conventional-changelog è disponibile
  try {
    execCommand('which npx', { silent: true });
  } catch (error) {
    throw new Error('npx non disponibile. Assicurati che Node.js sia installato.');
  }

  // Esegue conventional-changelog
  try {
    execCommand(
      `npx --yes conventional-changelog -p angular -i ${changelogPath} -s`,
      { silent: false }
    );
    core.info('CHANGELOG.md generato/aggiornato con successo');
  } catch (error) {
    core.warn(`Errore nella generazione changelog: ${error.message}`);
    // Non blocca l'esecuzione se il changelog fallisce
  }
}

/**
 * Crea release GitHub
 */
async function createRelease(octokit, owner, repo, version, changelogPath) {
  const tagWithPrefix = `v${version}`;

  // Verifica idempotenza: tag già esistente?
  const exists = await tagExists(octokit, owner, repo, tagWithPrefix);
  if (exists) {
    core.info(`Tag ${tagWithPrefix} già esistente, skip creazione release`);
    
    // Recupera release esistente per output URL
    try {
      const { data: release } = await octokit.rest.repos.getReleaseByTag({
        owner,
        repo,
        tag: tagWithPrefix
      });
      return release.html_url;
    } catch (error) {
      core.warn(`Impossibile recuperare URL release esistente: ${error.message}`);
      return null;
    }
  }

  // Legge changelog se esiste
  let releaseBody = `Release ${tagWithPrefix}`;
  if (fs.existsSync(changelogPath)) {
    const changelogContent = fs.readFileSync(changelogPath, 'utf-8');
    // Estrae sezione per questa versione (logica semplice)
    const versionMatch = changelogContent.match(
      new RegExp(`###? \\[?${version}\\]?[\\s\\S]*?(?=###? |$)`, 'i')
    );
    if (versionMatch) {
      releaseBody = versionMatch[0];
    }
  }

  core.info(`Creazione release ${tagWithPrefix}...`);
  const { data: release } = await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: tagWithPrefix,
    name: `Release ${tagWithPrefix}`,
    body: releaseBody,
    draft: false,
    prerelease: false
  });

  core.info(`Release creata: ${release.html_url}`);
  return release.html_url;
}

/**
 * Invia report al backend SaaS
 */
async function sendToBackend(backendUrl, apiKey, payload) {
  if (!backendUrl || !apiKey) {
    core.info('Backend URL o API key non forniti, skip invio report');
    return;
  }

  core.info(`Invio report al backend: ${backendUrl}`);

  const https = require('https');
  const http = require('http');
  const url = require('url');
  const { URL } = require('url');

  const parsedUrl = new URL(backendUrl);

  const postData = JSON.stringify(payload);
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'X-API-KEY': apiKey // Non loggare questa header nei log
    }
  };

  const client = parsedUrl.protocol === 'https:' ? https : http;

  try {
    await retryWithBackoff(async () => {
      return new Promise((resolve, reject) => {
        const req = client.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              core.info(`Report inviato con successo al backend (status: ${res.statusCode})`);
              resolve(data);
            } else {
              reject(new Error(`Backend risposto con status ${res.statusCode}: ${data}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.write(postData);
        req.end();
      });
    }, 3, 1000);

  } catch (error) {
    const errorMsg = `Errore nell'invio report al backend: ${error.message}`;
    core.error(errorMsg);
    throw error;
  }
}

/**
 * Main execution
 */
async function run() {
  try {
    // Inputs
    const githubToken = core.getInput('github-token', { required: true });
    const releaseType = core.getInput('release-type') || 'patch';
    const changelogPath = core.getInput('changelog-path') || 'CHANGELOG.md';
    const backendUrl = core.getInput('backend-url');
    const apiKey = core.getInput('api-key');
    const failOnBackendError = core.getBooleanInput('fail-on-backend-error') || false;

    // Validazione release-type
    const validReleaseTypes = ['major', 'minor', 'patch', 'none'];
    if (!validReleaseTypes.includes(releaseType)) {
      throw new Error(`release-type deve essere uno di: ${validReleaseTypes.join(', ')}`);
    }

    // Setup Octokit
    const octokit = github.getOctokit(githubToken);
    const { owner, repo } = github.context.repo;

    core.info(`Repository: ${owner}/${repo}`);
    core.info(`Release type: ${releaseType}`);

    let version = null;
    let releaseUrl = null;
    let tag = null;

    // Se release-type è 'none', solo genera changelog
    if (releaseType === 'none') {
      core.info('Release type è "none", generazione solo changelog...');
      generateChangelog(changelogPath);
      core.info('Changelog generato con successo');
      return;
    }

    // Calcola versione
    const latestTag = await getLatestTag(octokit, owner, repo);
    version = calculateNextVersion(latestTag, releaseType);
    tag = `v${version}`;

    core.info(`Prossima versione calcolata: ${version} (tag: ${tag})`);

    // Genera changelog
    generateChangelog(changelogPath);

    // Crea release
    releaseUrl = await createRelease(octokit, owner, repo, version, changelogPath);

    // Output
    if (releaseUrl) {
      core.setOutput('release-url', releaseUrl);
      core.setOutput('version', version);
      core.setOutput('tag', tag);
    }

    // Invia report al backend se configurato
    if (backendUrl && apiKey) {
      try {
        // Legge changelog per payload
        let changelogContent = '';
        if (fs.existsSync(changelogPath)) {
          changelogContent = fs.readFileSync(changelogPath, 'utf-8');
        }

        const payload = {
          repo: `${owner}/${repo}`,
          tag: tag,
          version: version,
          changelog: changelogContent,
          generatedAt: new Date().toISOString()
        };

        await sendToBackend(backendUrl, apiKey, payload);
      } catch (error) {
        if (failOnBackendError) {
          throw error;
        } else {
          core.warn(`Errore backend non bloccante: ${error.message}`);
        }
      }
    }

    core.info('✅ Action completata con successo');

  } catch (error) {
    core.setFailed(`❌ Action fallita: ${error.message}`);
    throw error;
  }
}

// Esegue main
run();
