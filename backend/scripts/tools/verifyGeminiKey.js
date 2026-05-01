/**
 * One-off: loads backend/.env and calls Gemini (does not print API key).
 * Usage: node scripts/verifyGeminiKey.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { GoogleGenerativeAI } = require('@google/generative-ai');

const REDACT = (s) =>
  String(s || '').replace(/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED]');

async function main() {
  const key = String(process.env.GEMINI_API_KEY || '').trim();
  if (!key) {
    console.error('GEMINI_API_KEY bos veya yok (.env).');
    process.exit(1);
  }

  const envModel = String(process.env.GEMINI_MODEL || '').trim();
  const candidates = envModel
    ? [envModel, 'gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-flash-latest']
    : ['gemini-2.0-flash', 'gemini-2.0-flash-001', 'gemini-flash-latest', 'gemini-1.5-flash'];

  const gen = new GoogleGenerativeAI(key);
  for (const name of [...new Set(candidates)]) {
    try {
      const model = gen.getGenerativeModel({ model: name });
      const r = await model.generateContent('Tek kelimeyle yanitla: TAMAM');
      const t = (await r.response).text();
      console.log('[OK] Gemini calisiyor.');
      console.log('Kullanilan model:', name);
      console.log('Ornek yanit:', String(t || '').trim().slice(0, 120));
      if (!envModel || envModel !== name) {
        console.log(
          '(Ipucu) .env icinde GEMINI_MODEL yoksa veya eskiyse su modeli deneyin:',
          name
        );
      }
      process.exit(0);
    } catch (e) {
      const msg = REDACT(e.message || e);
      if (String(msg).includes('404') || String(msg).includes('not found')) {
        continue;
      }
      if (String(msg).includes('429') || String(msg).toLowerCase().includes('quota')) {
        console.log('[KISMI OK] API anahtari kabul edildi; bu model icin kota/asim (429).');
        console.log('Model:', name);
        console.log(REDACT(msg.split('\n')[0]));
        console.log(
          'Birkac dakika sonra tekrar deneyin veya https://ai.google.dev/gemini-api/docs/rate-limits adresinden kotayi kontrol edin.'
        );
        process.exit(0);
      }
      console.error('[HATA] Model:', name);
      console.error(REDACT(msg));
      process.exit(1);
    }
  }

  console.error(
    '[HATA] Listelenen modellerden hicbiri bu anahtar ile generateContent kabul etmedi (404).'
  );
  console.error('Google AI Studio / API’de “List models” ile uygun flash model adini alin.');
  process.exit(1);
}

main();
