/**
 * Migration: create user_topic_progress table
 * Date: 2026-03-09
 *
 * Stores per-user, per-topic mastery and review counts for Duolingo-style
 * adaptive activities (flashcards, fill-blank, explanations, etc.).
 */

exports.up = async function(knex) {
  const has = await knex.schema.hasTable('user_topic_progress');
  if (!has) {
    await knex.schema.createTable('user_topic_progress', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable().index();
      table.integer('topic_id').unsigned().notNullable().index();
      table.smallint('mastery_level').notNullable().defaultTo(0).comment('0..5 arası basit seviye');
      table.integer('correct_count').notNullable().defaultTo(0);
      table.integer('wrong_count').notNullable().defaultTo(0);
      table.timestamp('last_reviewed').nullable();
      table.unique(['user_id', 'topic_id']);
    });
  }
};

exports.down = async function(knex) {
  const has = await knex.schema.hasTable('user_topic_progress');
  if (has) {
    await knex.schema.dropTable('user_topic_progress');
  }
};
