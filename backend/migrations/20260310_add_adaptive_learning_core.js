/**
 * Migration: adaptive learning core tables
 * Date: 2026-03-10
 *
 * Adds learner skill state, raw learning events, optional question-skill map,
 * and streak/xp state for adaptive learning and gamification.
 */

exports.up = async function(knex) {
  if (!(await knex.schema.hasTable('learner_skill_state'))) {
    await knex.schema.createTable('learner_skill_state', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().index();
      table.string('skill_key', 191).notNullable();
      table.string('topic_name', 255).nullable();
      table.integer('topic_id').unsigned().nullable();
      table.decimal('mastery_score', 5, 2).notNullable().defaultTo(0);
      table.decimal('confidence_score', 5, 2).notNullable().defaultTo(0);
      table.timestamp('last_seen_at').nullable();
      table.timestamp('last_correct_at').nullable();
      table.integer('correct_count').notNullable().defaultTo(0);
      table.integer('wrong_count').notNullable().defaultTo(0);
      table.integer('streak_correct').notNullable().defaultTo(0);
      table.integer('streak_wrong').notNullable().defaultTo(0);
      table.timestamp('review_due_at').nullable();
      table.smallint('current_difficulty_band').notNullable().defaultTo(1);
      table.timestamps(true, true);
      table.unique(['user_id', 'skill_key']);
      table.index(['user_id', 'review_due_at']);
    });
  }

  if (!(await knex.schema.hasTable('learner_activity_events'))) {
    await knex.schema.createTable('learner_activity_events', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().index();
      table.string('activity_type', 64).notNullable();
      table.integer('question_id').unsigned().nullable().index();
      table.string('skill_key', 191).nullable().index();
      table.integer('topic_id').unsigned().nullable();
      table.string('topic_name', 255).nullable();
      table.boolean('is_correct').nullable();
      table.integer('time_spent_ms').nullable();
      table.boolean('hint_used').notNullable().defaultTo(false);
      table.integer('attempt_no').notNullable().defaultTo(1);
      table.smallint('difficulty_level').nullable();
      table.string('source', 64).nullable();
      table.timestamps(true, true);
      table.index(['user_id', 'created_at']);
    });
  }

  if (!(await knex.schema.hasTable('question_skill_map'))) {
    await knex.schema.createTable('question_skill_map', function(table) {
      table.increments('id').primary();
      table.integer('question_id').unsigned().notNullable().index();
      table.string('skill_key', 191).notNullable().index();
      table.decimal('weight', 5, 2).notNullable().defaultTo(1);
      table.timestamps(true, true);
      table.unique(['question_id', 'skill_key']);
    });
  }

  if (!(await knex.schema.hasTable('learner_streaks'))) {
    await knex.schema.createTable('learner_streaks', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().unique();
      table.integer('daily_streak').notNullable().defaultTo(0);
      table.integer('longest_streak').notNullable().defaultTo(0);
      table.integer('xp_total').notNullable().defaultTo(0);
      table.integer('current_level').notNullable().defaultTo(1);
      table.date('last_active_date').nullable();
      table.integer('hearts_remaining').nullable();
      table.timestamps(true, true);
    });
  }
};

exports.down = async function(knex) {
  if (await knex.schema.hasTable('learner_streaks')) await knex.schema.dropTable('learner_streaks');
  if (await knex.schema.hasTable('question_skill_map')) await knex.schema.dropTable('question_skill_map');
  if (await knex.schema.hasTable('learner_activity_events')) await knex.schema.dropTable('learner_activity_events');
  if (await knex.schema.hasTable('learner_skill_state')) await knex.schema.dropTable('learner_skill_state');
};