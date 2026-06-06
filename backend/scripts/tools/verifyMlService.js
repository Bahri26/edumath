/**
 * ml-service bağlantı testi.
 * Kullanım: node scripts/tools/verifyMlService.js
 */
require('dotenv').config();
const mlServiceClient = require('../../services/mlServiceClient');

async function main() {
  console.log('ML_SERVICE_URL:', mlServiceClient.getBaseUrl() || '(tanımlı değil)');

  const health = await mlServiceClient.checkHealth();
  console.log('Health:', JSON.stringify(health, null, 2));

  if (!health.reachable) {
    process.exitCode = 1;
    return;
  }

  const sample = await mlServiceClient.analyzeTopics(
    [
      { topic: 'Örüntüler', total: 10, correct: 4, accuracy: 0.4, mastery: 0.4 },
      { topic: 'Geometri', total: 8, correct: 7, accuracy: 0.875, mastery: 0.875 },
      { topic: 'Kesirler', total: 5, correct: 2, accuracy: 0.4, mastery: 0.4 },
    ],
    { limit: 3, weakThreshold: 0.55 }
  );

  console.log('Analyze sample:', JSON.stringify(sample, null, 2));

  const enriched = await mlServiceClient.enrichQuestion({
    text: 'Birim küp örüntüsünde kural hangisidir?',
    options: ['4x', '2x+2', 'x+3', '3x'],
    ocrPreview: '1. adım 3 birim küp 2. adım 6 birim küp 3. adım 9 birim küp',
  });

  console.log('Enrich sample:', JSON.stringify(enriched, null, 2));
  if (!enriched?.correctAnswer) {
    console.warn('Enrich did not produce correctAnswer (solver may not match sample)');
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
