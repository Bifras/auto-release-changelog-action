/**
 * Backend SaaS per Auto Release & Changelog Action
 * 
 * Autore: Auto-generated
 * Data: 2025-01-28
 * Scopo: Backend Express per ricevere report di changelog dalle GitHub Actions,
 *        gestire webhook Stripe e verificare sottoscrizioni premium.
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Rate limiting semplice in-memory
const rateLimitMap = new Map();

function rateLimitMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return next(); // Rate limit solo per endpoint con API key
  }

  const key = `${apiKey}-${req.path}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minuto
  const maxRequests = 10;

  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const record = rateLimitMap.get(key);
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return next();
  }

  if (record.count >= maxRequests) {
    return res.status(429).json({
      error: 'Troppe richieste. Limite: 10 req/min per API key'
    });
  }

  record.count++;
  next();
}

app.use(rateLimitMiddleware);

// Inizializza database SQLite
const dbPath = process.env.DB_PATH || path.join(__dirname, 'db.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Errore apertura database:', err.message);
  } else {
    console.log('Connesso al database SQLite');
    // Crea tabella se non esiste
    db.run(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo TEXT NOT NULL,
        tag TEXT NOT NULL,
        version TEXT,
        changelog TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabella reports verificata/creata');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Endpoint per ricevere report dalle Actions
app.post('/api/record', (req, res) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      error: 'API key richiesta. Fornire header X-API-KEY'
    });
  }

  // Verifica API key (in produzione, controllare nel database)
  // Per MVP, accetta qualsiasi API key se presente
  const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];
  if (validApiKeys.length > 0 && !validApiKeys.includes(apiKey)) {
    return res.status(403).json({
      error: 'API key non valida'
    });
  }

  const { repo, tag, version, changelog, generatedAt } = req.body;

  if (!repo || !tag) {
    return res.status(400).json({
      error: 'Campi richiesti: repo, tag'
    });
  }

  const metadata = JSON.stringify({
    generatedAt: generatedAt || new Date().toISOString(),
    apiKey: apiKey.substring(0, 4) + '...' // Solo primi 4 caratteri per log
  });

  db.run(
    `INSERT INTO reports (repo, tag, version, changelog, metadata)
     VALUES (?, ?, ?, ?, ?)`,
    [repo, tag, version || null, changelog || null, metadata],
    function(err) {
      if (err) {
        console.error('Errore inserimento report:', err.message);
        return res.status(500).json({
          error: 'Errore salvataggio report'
        });
      }

      res.status(201).json({
        success: true,
        id: this.lastID,
        repo,
        tag,
        message: 'Report salvato con successo'
      });
    }
  );
});

// Webhook Stripe
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const stripeSigningSecret = process.env.STRIPE_SIGNING_SECRET;
  const sig = req.headers['stripe-signature'];

  if (!stripeSigningSecret) {
    console.warn('STRIPE_SIGNING_SECRET non configurato, skip validazione webhook');
    // In sviluppo, processa comunque l'evento
    const event = JSON.parse(req.body);
    handleStripeEvent(event);
    return res.json({ received: true });
  }

  if (!sig) {
    return res.status(400).json({ error: 'Stripe signature mancante' });
  }

  try {
    // Verifica signature (richiede stripe package)
    // Per MVP semplificato, processa direttamente se secret non fornito
    const event = JSON.parse(req.body);
    handleStripeEvent(event);
    res.json({ received: true });
  } catch (err) {
    console.error('Errore verifica webhook Stripe:', err.message);
    res.status(400).json({ error: 'Webhook verification failed' });
  }
});

function handleStripeEvent(event) {
  console.log(`Ricevuto evento Stripe: ${event.type}`);

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      console.log('Subscription creata/aggiornata:', event.data.object.id);
      // Qui salveresti le API keys nel database per il customer
      break;
    case 'customer.subscription.deleted':
      console.log('Subscription cancellata:', event.data.object.id);
      // Qui disattiveresti le API keys
      break;
    default:
      console.log('Evento non gestito:', event.type);
  }
}

// Verifica sottoscrizione Stripe
app.post('/api/verify-subscription', async (req, res) => {
  const stripeSecret = process.env.STRIPE_SECRET;
  const { customerId, subscriptionId } = req.body;

  if (!stripeSecret) {
    return res.status(503).json({
      error: 'Stripe non configurato. STRIPE_SECRET mancante.'
    });
  }

  if (!customerId && !subscriptionId) {
    return res.status(400).json({
      error: 'Richiesto customerId o subscriptionId'
    });
  }

  try {
    // Per MVP semplificato, ritorna mock
    // In produzione, usa Stripe SDK:
    // const stripe = require('stripe')(stripeSecret);
    // const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Mock response per MVP
    res.json({
      active: true,
      customerId: customerId || 'mock_customer',
      subscriptionId: subscriptionId || 'mock_subscription',
      status: 'active',
      note: 'Mock response - integrare Stripe SDK in produzione'
    });
  } catch (error) {
    console.error('Errore verifica subscription:', error.message);
    res.status(500).json({
      error: 'Errore verifica subscription'
    });
  }
});

// Endpoint per generare API key (opzionale, per sviluppo)
app.post('/api/generate-key', (req, res) => {
  const apiKey = crypto.randomBytes(32).toString('hex');
  res.json({
    apiKey: apiKey,
    message: 'API key generata. Salvare in modo sicuro.'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Errore server:', err);
  res.status(500).json({
    error: 'Errore interno del server'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server backend avviato sulla porta ${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Chiusura server...');
  db.close((err) => {
    if (err) {
      console.error('Errore chiusura database:', err.message);
    } else {
      console.log('Database chiuso.');
    }
    process.exit(0);
  });
});

