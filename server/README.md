# 🚀 Backend SaaS - Auto Release & Changelog

Backend Express.js per ricevere e gestire report di changelog dalle GitHub Actions, con integrazione Stripe per sottoscrizioni premium.

## ✨ Caratteristiche

- ✅ Endpoint `/api/record` per ricevere report dalle Actions
- ✅ Storage SQLite per report (migrabile a Postgres)
- ✅ Webhook Stripe per gestione sottoscrizioni
- ✅ Rate limiting (10 req/min per API key)
- ✅ Health check endpoint
- ✅ Verifica sottoscrizioni Stripe

## 📦 Installazione

```bash
cd server
npm install
```

## 🔧 Configurazione

### Variabili d'Ambiente

Crea un file `.env` nella cartella `server/`:

```env
# Porta server (default: 3000)
PORT=3000

# Path database SQLite (default: ./db.sqlite)
DB_PATH=./db.sqlite

# API Keys valide (separate da virgola, opzionale)
API_KEYS=key1,key2,key3

# Stripe Configuration (opzionale, per funzionalità premium)
STRIPE_SECRET=sk_test_...
STRIPE_SIGNING_SECRET=whsec_...
```

### Generare API Key

Puoi generare una API key usando l'endpoint di sviluppo:

```bash
curl -X POST http://localhost:3000/api/generate-key
```

## 🚀 Avvio Locale

```bash
npm start
```

Oppure con auto-reload (richiede nodemon):

```bash
npm run dev
```

## 📡 Endpoint API

### POST `/api/record`

Salva un report di changelog dalla GitHub Action.

**Headers:**
- `X-API-KEY`: API key per autenticazione (richiesto)
- `Content-Type`: `application/json`

**Body:**
```json
{
  "repo": "owner/repo",
  "tag": "v1.2.3",
  "version": "1.2.3",
  "changelog": "### Features\n- ...",
  "generatedAt": "2025-01-28T12:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "id": 1,
  "repo": "owner/repo",
  "tag": "v1.2.3",
  "message": "Report salvato con successo"
}
```

### GET `/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-28T12:00:00.000Z",
  "uptime": 3600
}
```

### POST `/webhook/stripe`

Endpoint webhook per eventi Stripe (subscription.created, subscription.updated, subscription.deleted).

**Headers:**
- `stripe-signature`: Signature Stripe per validazione

**Note:** Configura questo URL nel dashboard Stripe come webhook endpoint.

### POST `/api/verify-subscription`

Verifica stato sottoscrizione Stripe.

**Body:**
```json
{
  "customerId": "cus_...",
  "subscriptionId": "sub_..."
}
```

**Response:**
```json
{
  "active": true,
  "customerId": "cus_...",
  "subscriptionId": "sub_...",
  "status": "active"
}
```

### POST `/api/generate-key`

Genera una nuova API key (solo per sviluppo/test).

**Response:**
```json
{
  "apiKey": "abc123...",
  "message": "API key generata. Salvare in modo sicuro."
}
```

## 🧪 Test Locale

### Test Health Check

```bash
curl http://localhost:3000/health
```

### Test Record Endpoint

```bash
curl -X POST http://localhost:3000/api/record \
  -H "X-API-KEY: testkey" \
  -H "Content-Type: application/json" \
  -d '{
    "repo": "owner/repo",
    "tag": "v0.1.0",
    "version": "0.1.0",
    "changelog": "### Features\n- Initial release",
    "generatedAt": "2025-01-28T12:00:00Z"
  }'
```

### Generare API Key

```bash
curl -X POST http://localhost:3000/api/generate-key
```

## 🚀 Deploy

### Heroku

```bash
# Crea app Heroku
heroku create your-app-name

# Configura variabili d'ambiente
heroku config:set PORT=3000
heroku config:set STRIPE_SECRET=sk_live_...
heroku config:set STRIPE_SIGNING_SECRET=whsec_...

# Deploy
git push heroku main
```

### Vercel

Crea `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server/index.js"
    }
  ]
}
```

```bash
vercel deploy
```

### Railway / Render

1. Connetti il repository
2. Imposta `Start Command`: `cd server && npm start`
3. Configura variabili d'ambiente nel dashboard
4. Deploy automatico

## 🔒 Sicurezza

- ✅ Rate limiting implementato (10 req/min per API key)
- ✅ API keys validate (configurabile via env)
- ✅ Stripe webhook signature validation
- ✅ Input validation e sanitizzazione
- ⚠️ **MVP**: Per produzione, aggiungere:
  - Autenticazione JWT
  - HTTPS enforcement
  - CORS configuration
  - Database connection pooling
  - Logging strutturato

## 📊 Database

### Schema SQLite

```sql
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  repo TEXT NOT NULL,
  tag TEXT NOT NULL,
  version TEXT,
  changelog TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Migrazione a Postgres (opzionale)

Per produzione, considera migrare a Postgres:

```bash
npm install pg
```

Aggiorna `server/index.js` per usare `pg` invece di `sqlite3`.

## 💰 Integrazione Stripe

1. **Crea account Stripe** e ottieni API keys
2. **Configura webhook** nel dashboard Stripe:
   - URL: `https://your-backend.com/webhook/stripe`
   - Eventi: `customer.subscription.*`
3. **Ottieni signing secret** dal webhook configurato
4. **Imposta variabili d'ambiente** nel server

## 📝 Note di Produzione

- ⚠️ SQLite non è ideale per alta concorrenza; considera Postgres
- ⚠️ Rate limiting in-memory si resetta ad ogni riavvio; usa Redis per produzione
- ⚠️ Implementa backup automatici del database
- ⚠️ Aggiungi monitoring (Sentry, DataDog, etc.)
- ⚠️ Configura CORS appropriatamente
- ⚠️ Usa HTTPS in produzione

## 📄 Licenza

MIT License


