/**
 * Egzersiz tipleri bootstrap: sorular + tüm egzersizleri yenile.
 * npm run bootstrap:exercise-types
 */
const { main: seedQuestions } = require('./seedExerciseTypesByGrade');
const { main: seedExercises } = require('./seedExercisesByGrade');

async function main() {
  await seedQuestions();
  await seedExercises();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main };
