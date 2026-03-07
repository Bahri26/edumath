/**
 * Migration: Create All Missing Core Tables
 * Date: 2026-03-04
 * 
 * Creates questions, exams, surveys and all supporting tables
 */

exports.up = async function(knex) {
  // 1. Create QUESTIONS table
  if (!(await knex.schema.hasTable('questions'))) {
    await knex.schema.createTable('questions', function(table) {
      table.increments('id').primary();
      table.integer('created_by').unsigned().notNullable();
      table.string('subject', 100).nullable();
      table.text('content_text').notNullable();
      table.enum('type', ['multiple_choice', 'short_answer', 'essay', 'true_false', 'matching']).defaultTo('multiple_choice');
      table.integer('points').defaultTo(1);
      table.enum('difficulty_level', ['easy', 'medium', 'hard']).defaultTo('medium');
      table.text('correct_answer').nullable();
      table.boolean('is_published').defaultTo(false);
      table.integer('usage_count').defaultTo(0);
      table.timestamps();

      table.index('created_by');
      table.index('subject');
      table.index('type');
    });
  }

  // 2. Create EXAMS table
  if (!(await knex.schema.hasTable('exams'))) {
    await knex.schema.createTable('exams', function(table) {
      table.increments('id').primary();
      table.integer('course_id').unsigned().nullable();
      table.integer('created_by').unsigned().notNullable();
      table.string('title', 255).notNullable();
      table.text('description').nullable();
      table.dateTime('start_date').notNullable();
      table.dateTime('end_date').notNullable();
      table.integer('duration_minutes').defaultTo(60);
      table.enum('exam_type', ['formative', 'summative', 'diagnostic']).defaultTo('summative');
      table.boolean('is_published').defaultTo(false);
      table.enum('status', ['draft', 'published', 'archived']).defaultTo('draft');
      table.integer('total_questions').defaultTo(0);
      table.integer('total_points').defaultTo(0);
      table.timestamps();

      table.index('course_id');
      table.index('created_by');
      table.index('start_date');
      table.index('is_published');
    });
  }

  // 3. Create SURVEYS table
  if (!(await knex.schema.hasTable('surveys'))) {
    await knex.schema.createTable('surveys', function(table) {
      table.increments('id').primary();
      table.integer('created_by').unsigned().notNullable();
      table.string('title', 255).notNullable();
      table.text('description').nullable();
      table.enum('status', ['draft', 'published', 'closed']).defaultTo('draft');
      table.boolean('is_anonymous').defaultTo(true);
      table.dateTime('start_date').nullable();
      table.dateTime('end_date').nullable();
      table.integer('target_responses').nullable();
      table.integer('actual_responses').defaultTo(0);
      table.timestamps();

      table.index('created_by');
      table.index('status');
    });
  }

  // 4. Create SURVEY_QUESTIONS table
  if (!(await knex.schema.hasTable('survey_questions'))) {
    await knex.schema.createTable('survey_questions', function(table) {
      table.increments('id').primary();
      table.integer('survey_id').unsigned().notNullable();
      table.text('question_text').notNullable();
      table.enum('question_type', ['text', 'single_choice', 'multiple_choice', 'rating', 'matrix']).defaultTo('single_choice');
      table.boolean('is_required').defaultTo(true);
      table.integer('sort_order').defaultTo(0);
      table.timestamps();

      table.index('survey_id');
      table.index('sort_order');
    });
  }

  // 5. Create SURVEY_QUESTION_OPTIONS table
  if (!(await knex.schema.hasTable('survey_question_options'))) {
    await knex.schema.createTable('survey_question_options', function(table) {
      table.increments('id').primary();
      table.integer('survey_question_id').unsigned().notNullable();
      table.text('option_text').notNullable();
      table.integer('sort_order').defaultTo(0);
      table.timestamps();

      table.index('survey_question_id');
    });
  }

  // 6. Create SURVEY_RESPONSES table
  if (!(await knex.schema.hasTable('survey_responses'))) {
    await knex.schema.createTable('survey_responses', function(table) {
      table.increments('id').primary();
      table.integer('survey_id').unsigned().notNullable();
      table.integer('respondent_id').unsigned().nullable();
      table.dateTime('submitted_at').notNullable();
      table.boolean('is_anonymous').defaultTo(false);
      table.timestamps();

      table.index('survey_id');
      table.index('respondent_id');
    });
  }

  // 7. Create SURVEY_RESPONSE_ANSWERS table  
  if (!(await knex.schema.hasTable('survey_response_answers'))) {
    await knex.schema.createTable('survey_response_answers', function(table) {
      table.increments('id').primary();
      table.integer('survey_response_id').unsigned().notNullable();
      table.integer('survey_question_id').unsigned().notNullable();
      table.text('answer_text').nullable();
      table.integer('selected_option_id').unsigned().nullable();
      table.timestamps();

      table.index('survey_response_id');
      table.index('survey_question_id');
    });
  }

  // 8. Create EXAM_QUESTIONS table
  if (!(await knex.schema.hasTable('exam_questions'))) {
    await knex.schema.createTable('exam_questions', function(table) {
      table.increments('id').primary();
      table.integer('exam_id').unsigned().notNullable();
      table.integer('question_id').unsigned().notNullable();
      table.integer('points').defaultTo(1);
      table.integer('sort_order').defaultTo(0);
      table.integer('section_id').unsigned().nullable();
      table.timestamps();

      table.index('exam_id');
      table.index('question_id');
      table.index('sort_order');
    });
  }

  // 9. Create QUESTION_OPTIONS table
  if (!(await knex.schema.hasTable('question_options'))) {
    await knex.schema.createTable('question_options', function(table) {
      table.increments('id').primary();
      table.integer('question_id').unsigned().notNullable();
      table.text('option_text').notNullable();
      table.boolean('is_correct').defaultTo(false);
      table.text('explanation').nullable();
      table.integer('sort_order').defaultTo(0);
      table.timestamps();

      table.index('question_id');
      table.index('sort_order');
    });
  }

  // 10. Create STUDENT_EXAM_ATTEMPTS table
  if (!(await knex.schema.hasTable('student_exam_attempts'))) {
    await knex.schema.createTable('student_exam_attempts', function(table) {
      table.increments('id').primary();
      table.integer('exam_id').unsigned().notNullable();
      table.integer('student_id').unsigned().notNullable();
      table.integer('attempt_number').defaultTo(1);
      table.dateTime('started_at').notNullable();
      table.dateTime('submitted_at').nullable();
      table.dateTime('completed_at').nullable();
      table.integer('time_spent_seconds').defaultTo(0);
      table.enum('status', ['in_progress', 'submitted', 'graded', 'abandoned']).defaultTo('in_progress');
      table.integer('total_score').nullable();
      table.integer('percentage_score').nullable();
      table.boolean('is_passed').nullable();
      table.text('remarks').nullable();
      table.integer('graded_by').unsigned().nullable();
      table.dateTime('graded_at').nullable();
      table.timestamps();

      table.index('exam_id');
      table.index('student_id');
      table.index('status');
    });
  }

  // 11. Create EXAM_ANSWERS table
  if (!(await knex.schema.hasTable('exam_answers'))) {
    await knex.schema.createTable('exam_answers', function(table) {
      table.increments('id').primary();
      table.integer('attempt_id').unsigned().notNullable();
      table.integer('exam_id').unsigned().notNullable();
      table.integer('question_id').unsigned().notNullable();
      table.text('answer_text').nullable();
      table.integer('selected_option_id').unsigned().nullable();
      table.integer('points_earned').nullable();
      table.boolean('is_correct').nullable();
      table.text('feedback').nullable();
      table.dateTime('answered_at').nullable();
      table.timestamps();

      table.index('attempt_id');
      table.index('exam_id');
      table.index('question_id');
    });
  }

  // 12. Create LEARNING_PATHS table
  if (!(await knex.schema.hasTable('learning_paths'))) {
    await knex.schema.createTable('learning_paths', function(table) {
      table.increments('id').primary();
      table.integer('student_id').unsigned().notNullable();
      table.integer('course_id').unsigned().nullable();
      table.string('title', 255).notNullable();
      table.text('description').nullable();
      table.enum('status', ['active', 'paused', 'completed', 'archived']).defaultTo('active');
      table.integer('progress_percentage').defaultTo(0);
      table.dateTime('started_at').nullable();
      table.dateTime('completed_at').nullable();
      table.timestamps();

      table.index('student_id');
      table.index('status');
    });
  }

  // 13. Create DAILY_QUESTS table
  if (!(await knex.schema.hasTable('daily_quests'))) {
    await knex.schema.createTable('daily_quests', function(table) {
      table.increments('id').primary();
      table.integer('learning_path_id').unsigned().nullable();
      table.integer('student_id').unsigned().notNullable();
      table.string('title', 255).notNullable();
      table.text('description').nullable();
      table.integer('xp_reward').defaultTo(100);
      table.enum('status', ['pending', 'in_progress', 'completed']).defaultTo('pending');
      table.dateTime('assigned_at').notNullable();
      table.dateTime('completed_at').nullable();
      table.timestamps();

      table.index('student_id');
      table.index('status');
    });
  }
};

exports.down = async function(knex) {
  // This migration doesn't drop tables, just creates them
  // No rollback needed for additive changes
};
