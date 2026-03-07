/**
 * Check AP CSA topics
 */
const knex = require('../db/knex');

(async () => {
  try {
    // First check table structure
    const columns = await knex.raw("DESCRIBE questions");
    console.log('Questions table columns:');
    columns[0].forEach(c => console.log(`  - ${c.Field} (${c.Type})`));
    
    // Check questions table for Unit topics
    const questions = await knex('questions')
      .whereRaw("topic LIKE '%Unit%'")
      .select('*')
      .limit(10);
    
    console.log(`\nFound ${questions.length} questions with 'Unit' in topic:`, JSON.stringify(questions, null, 2));
    
    // Check all topics
    const topics = await knex('questions').distinct('topic').select('topic');
    console.log(`\nAll unique topics in questions table (${topics.length} total):`);
    topics.forEach(t => console.log(`  - ${t.topic}`));
    
    process.exit(0);
  } catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
