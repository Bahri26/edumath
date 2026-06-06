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
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
