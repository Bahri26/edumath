const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { generatePatternQuestions } = require('../services/aiQuestionGeneratorService');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const batches = [
    { classLevel: '1. Sınıf', difficulty: 'Kolay', count: 3 },
    { classLevel: '5. Sınıf', difficulty: 'Orta', count: 3 },
    { classLevel: '9. Sınıf', difficulty: 'Zor', count: 3 },
  ];

  const results = [];
  for (const batch of batches) {
    const result = await generatePatternQuestions(batch);
    results.push({ ...batch, generator: result.generator, questions: result.questions });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    topic: 'Örüntüler',
    subject: 'Matematik',
    batches: results,
  };

  const reportsDir = path.join(__dirname, '..', 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });
  const outputPath = path.join(reportsDir, 'ai-pattern-question-pack.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');

  console.log(JSON.stringify({
    outputPath,
    batchCount: results.length,
    generators: [...new Set(results.map((batch) => batch.generator))],
    questionCount: results.reduce((sum, batch) => sum + batch.questions.length, 0),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});