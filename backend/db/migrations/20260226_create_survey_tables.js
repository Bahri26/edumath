exports.up = function(knex) {
  return knex.schema.createTable('surveys', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  })
  .createTable('survey_questions', function(table) {
    table.increments('id').primary();
    table.integer('survey_id').unsigned().references('id').inTable('surveys').onDelete('CASCADE');
    table.string('question_text').notNullable();
    table.string('question_type').notNullable(); // text, radio, checkbox, scale, etc.
    table.json('options'); // for multiple choice
  })
  .createTable('survey_responses', function(table) {
    table.increments('id').primary();
    table.integer('survey_id').unsigned().references('id').inTable('surveys').onDelete('CASCADE');
    table.integer('user_id').unsigned(); // opsiyonel: kullanıcıya bağlamak için
    table.timestamp('submitted_at').defaultTo(knex.fn.now());
  })
  .createTable('survey_answers', function(table) {
    table.increments('id').primary();
    table.integer('response_id').unsigned().references('id').inTable('survey_responses').onDelete('CASCADE');
    table.integer('question_id').unsigned().references('id').inTable('survey_questions').onDelete('CASCADE');
    table.text('answer');
  });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('survey_answers')
    .dropTableIfExists('survey_responses')
    .dropTableIfExists('survey_questions')
    .dropTableIfExists('surveys');
};
