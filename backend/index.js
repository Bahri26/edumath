console.log('=== [EDUMATH] index.js başlatılıyor ===');
require('dotenv').config();
const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// CORS Ayarları
app.use((req, res, next) => {
  // Production'da sadece frontend domainine izin ver
  const allowedOrigins = ['http://localhost:5173', 'https://edumath.app', 'https://www.edumath.app'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-no-auth-redirect');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Vision endpoint sends base64 images in JSON; default 100kb is too small.
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// API route'larını /api önekiyle mount et
function mountApiV1Routes() {
  const routesDir = path.join(__dirname, 'routes');
  if (fs.existsSync(routesDir)) {
    fs.readdirSync(routesDir).forEach((file) => {
      if (!file.endsWith('.js')) return;
      const routeName = path.basename(file, '.js');
      try {
        const router = require(path.join(__dirname, 'routes', file));
        app.use(`/api/${routeName}`, router);
        console.log(`Mounted route: /api/${routeName}`);
      } catch (err) {
        console.error(`Failed to mount route ${file}:`, err.message);
      }
    });
  }
}


// AI içerik API proxy'sini manuel mount et
const aiContentRouter = require('./routes/ai_content');
app.use('/api/ai-content', aiContentRouter);
mountApiV1Routes();

// Sağlık Kontrolü (Cloud Run bu endpoint'i kontrol edebilir)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date() });
});

// Frontend dosyalarının sunulması (backend/dist)
const frontendPath = path.join(__dirname, 'dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
}

// SPA Desteği: API dışındaki tüm istekleri frontend'e yönlendir
// Bu satır tüm API tanımlamalarının EN ALTINDA olmalı
app.get('*', (req, res) => {
  const indexFile = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexFile)) {
    res.sendFile(indexFile);
  } else {
    res.status(404).send('Frontend build (dist) not found');
  }
});

console.log('=== [EDUMATH] app.listen çağrılacak ===');
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});