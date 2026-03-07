/**
 * Initial schema for edumath MVP
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('users', function(t) {
      t.increments('id').primary();
      t.string('role').notNullable(); // 'student' | 'teacher' | 'admin'
      t.string('name');
      t.string('email_hash').unique();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('students', function(t) {
      t.increments('id').primary();
      t.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
      t.uuid('anon_id').notNullable().unique();
      t.json('demographic').nullable();
    })
    .createTable('questions', function(t) {
      t.increments('id').primary();
      t.text('stem').notNullable();
      t.string('type').notNullable(); // multiple_choice, open, interactive, etc.
      t.integer('estimated_time_ms').nullable();
      t.string('difficulty_label').nullable(); // A1..C2 or custom
      t.string('source').nullable();
      t.string('license').nullable();
      t.json('meta').nullable();
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('sessions', function(t) {
      t.increments('id').primary();
      t.uuid('student_anon_id').notNullable();
      t.string('session_type').notNullable(); // pre|mini|post
      t.timestamp('started_at').defaultTo(knex.fn.now());
      t.timestamp('ended_at').nullable();
      t.json('context').nullable();
    })
    .createTable('responses', function(t) {
      t.increments('id').primary();
      t.integer('session_id').unsigned().references('id').inTable('sessions').onDelete('CASCADE');
      t.integer('question_id').unsigned().references('id').inTable('questions');
      t.text('response').nullable();
      t.boolean('correct').nullable();
      t.integer('response_time_ms').nullable();
      t.timestamp('ts').defaultTo(knex.fn.now());
    })
    .createTable('interventions', function(t) {
      t.increments('id').primary();
      t.uuid('student_anon_id').notNullable();
      t.integer('teacher_id').unsigned().references('id').inTable('users');
      t.string('content_ref').nullable();
      t.string('status').defaultTo('assigned');
      t.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('consents', function(t) {
      t.increments('id').primary();
      t.uuid('student_anon_id').notNullable();
      t.string('consent_version').notNullable();
      t.timestamp('accepted_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('consents')
    .dropTableIfExists('interventions')
    .dropTableIfExists('responses')
    .dropTableIfExists('sessions')
    .dropTableIfExists('questions')
    .dropTableIfExists('students')
    .dropTableIfExists('users');
};
