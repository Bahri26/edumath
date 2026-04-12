const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const Question = require('../models/Question');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

function sortByGrade(left, right) {
  const leftValue = Number.parseInt(left.classLevel, 10);
  const rightValue = Number.parseInt(right.classLevel, 10);

  if (leftValue !== rightValue) {
    return leftValue - rightValue;
  }

  return left.text.localeCompare(right.text, 'tr');
}

async function main() {
  const dbName = (process.env.MONGODB_DB || process.env.MONGO_DB || 'Edumath').trim();
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGODB_URI veya MONGO_URI tanimli degil.');
  }

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10000 });

  try {
    const questions = await Question.find({
      topic: 'Örüntüler',
      subject: 'Matematik',
    })
      .select('classLevel difficulty text image options')
      .sort({ classLevel: 1, difficulty: 1, text: 1 })
      .lean();

    const mappings = questions.map((question) => ({
      classLevel: question.classLevel,
      difficulty: question.difficulty,
      text: question.text,
      image: question.image || '',
      optionImages: (question.options || [])
        .filter((option) => option.image)
        .map((option) => ({ text: option.text, image: option.image })),
    }));

    const missingQuestionImages = mappings.filter((mapping) => !mapping.image);
    const missingOptionImages = mappings.filter(
      (mapping) => mapping.optionImages.length === 0
    );

    const imageUsage = mappings.reduce((accumulator, mapping) => {
      const key = mapping.image || 'MISSING';
      if (!accumulator[key]) {
        accumulator[key] = [];
      }

      accumulator[key].push({
        classLevel: mapping.classLevel,
        difficulty: mapping.difficulty,
        text: mapping.text,
      });
      return accumulator;
    }, {});

    const report = {
      db: dbName,
      generatedAt: new Date().toISOString(),
      totalQuestions: mappings.length,
      missingQuestionImageCount: missingQuestionImages.length,
      questionsWithoutOptionImagesCount: missingOptionImages.length,
      imageUsage: Object.entries(imageUsage)
        .sort(([left], [right]) => left.localeCompare(right, 'en'))
        .map(([image, usages]) => ({
          image,
          usageCount: usages.length,
          questions: usages.sort(sortByGrade),
        })),
      mappings,
    };

    const reportsDir = path.join(__dirname, '..', 'reports');
    fs.mkdirSync(reportsDir, { recursive: true });
    const reportPath = path.join(reportsDir, 'pattern-image-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

    console.log(JSON.stringify({
      db: dbName,
      totalQuestions: report.totalQuestions,
      missingQuestionImageCount: report.missingQuestionImageCount,
      questionsWithoutOptionImagesCount: report.questionsWithoutOptionImagesCount,
      distinctImages: report.imageUsage.length,
      reportPath,
    }, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});