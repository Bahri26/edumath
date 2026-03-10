const { inferSkillMappings } = require('../lib/skillMapping');

exports.up = async function(knex) {
  const hasQuestions = await knex.schema.hasTable('questions');
  const hasMap = await knex.schema.hasTable('question_skill_map');
  if (!hasQuestions || !hasMap) return;

  const questions = await knex('questions').select('question_id', 'topic', 'content_text');
  for (const question of questions) {
    const existing = await knex('question_skill_map').where({ question_id: question.question_id }).first();
    if (existing) continue;
    const mappings = inferSkillMappings(question);
    for (const mapping of mappings) {
      await knex('question_skill_map').insert({
        question_id: question.question_id,
        skill_key: mapping.skill_key,
        weight: mapping.weight || 1,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    }
  }
};

exports.down = async function(knex) {
  if (await knex.schema.hasTable('question_skill_map')) {
    await knex('question_skill_map').del();
  }
};