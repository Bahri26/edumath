/**
 * Migration: Create complete exam system and enhance questions
 */

exports.up = function(knex) {
  return (
    knex.schema
      // 1. ENHANCE QUESTIONS TABLE
      .table('questions', function(t) {
        // Add missing fields
        t.string('content_text').nullable().comment('Alternative to stem');
        t.integer('points').nullable().defaultTo(1).comment('Point value');
        t.integer('difficulty_level').nullable().comment('1-5 scale');
        t.string('class_level').nullable().comment('A1-C2, grade level, etc.');
        t.text('correct_answer').nullable().comment('Correct answer for auto-grading');
        t.integer('learning_objective_id').unsigned().nullable();
        t.boolean('is_active').defaultTo(true);
      })

      // 2. CREATE QUESTION_OPTIONS TABLE
      .createTable('question_options', function(t) {
        t.increments('id').primary();
        t.integer('question_id').unsigned().references('id').inTable('questions').onDelete('CASCADE');
        t.text('option_text').notNullable();
        t.integer('sort_order').defaultTo(0);
        t.boolean('is_correct').defaultTo(false);
        t.text('explanation').nullable();
        t.timestamp('created_at').defaultTo(knex.fn.now());
      })

      // 3. CREATE EXAMS TABLE
      .createTable('exams', function(t) {
        t.increments('exam_id').primary();
        t.string('title').notNullable();
        t.text('description').nullable();
        t.integer('course_id').unsigned().nullable().comment('Which course this exam belongs to');
        t.integer('teacher_id').unsigned().references('id').inTable('users').nullable();
        
        // Configuration
        t.integer('duration_minutes').defaultTo(60);
        t.integer('total_points').defaultTo(100);
        t.integer('passing_score').defaultTo(60).comment('Minimum points to pass');
        
        // Status and scheduling
        t.string('status').defaultTo('draft').comment('draft, published, archived');
        t.boolean('is_published').defaultTo(false);
        t.datetime('exam_date').nullable();
        t.datetime('start_time').nullable();
        t.datetime('end_time').nullable();
        
        // Features
        t.boolean('show_feedback_immediately').defaultTo(false);
        t.boolean('allow_review').defaultTo(true);
        t.boolean('randomize_questions').defaultTo(false);
        t.boolean('shuffle_options').defaultTo(false);
        
        // Assessment type
        t.string('assessment_type').defaultTo('standard').comment('standard, adaptive, cumulative');
        t.json('settings').nullable().comment('Additional exam configuration');
        
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());
      })

      // 4. CREATE EXAM_QUESTIONS TABLE (link table)
      .createTable('exam_questions', function(t) {
        t.increments('id').primary();
        t.integer('exam_id').unsigned().references('exam_id').inTable('exams').onDelete('CASCADE');
        t.integer('question_id').unsigned().references('id').inTable('questions').onDelete('CASCADE');
        t.integer('sort_order').defaultTo(0);
        t.integer('points_override').nullable().comment('Override question points for this exam');
        t.json('adaptive_config').nullable().comment('IRT parameters for adaptive testing');
        t.timestamp('created_at').defaultTo(knex.fn.now());
        
        // Unique constraint to prevent duplicate questions in same exam
        t.unique(['exam_id', 'question_id']);
      })

      // 5. CREATE STUDENT EXAM ATTEMPTS
      .createTable('student_exam_attempts', function(t) {
        t.increments('attempt_id').primary();
        t.integer('exam_id').unsigned().references('exam_id').inTable('exams').onDelete('CASCADE');
        t.integer('student_id').unsigned().references('id').inTable('students').onDelete('CASCADE');
        t.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
        
        // Timing
        t.datetime('started_at').defaultTo(knex.fn.now());
        t.datetime('submitted_at').nullable();
        
        // Results
        t.string('status').defaultTo('in_progress').comment('in_progress, submitted, graded');
        t.integer('score').nullable();
        t.integer('total_points').nullable();
        t.decimal('percentage', 5, 2).nullable();
        t.string('grade').nullable().comment('A, B, C, etc.');
        t.boolean('passed').nullable();
        
        // Metadata
        t.text('notes').nullable();
        t.json('metadata').nullable().comment('Browser info, IP, etc.');
        
        t.timestamp('created_at').defaultTo(knex.fn.now());
        t.timestamp('updated_at').defaultTo(knex.fn.now());
      })

      // 6. CREATE EXAM ANSWERS TABLE
      .createTable('exam_answers', function(t) {
        t.increments('answer_id').primary();
        t.integer('attempt_id').unsigned().references('attempt_id').inTable('student_exam_attempts').onDelete('CASCADE');
        t.integer('question_id').unsigned().references('id').inTable('questions').onDelete('CASCADE');
        t.integer('exam_question_id').unsigned().references('id').inTable('exam_questions').nullable();
        
        // Answer data
        t.text('student_answer').nullable();
        t.integer('selected_option_id').unsigned().references('id').inTable('question_options').nullable();
        
        // Grading
        t.boolean('is_correct').nullable();
        t.integer('points_earned').nullable();
        t.text('teacher_feedback').nullable();
        
        // Timing
        t.integer('time_spent_seconds').nullable();
        t.integer('answer_sequence').nullable().comment('Order in which answer was given');
        
        t.timestamp('answered_at').defaultTo(knex.fn.now());
        t.timestamp('created_at').defaultTo(knex.fn.now());
      })

      // 7. ENHANCE SURVEYS TABLE
      .table('surveys', function(t) {
        t.integer('course_id').unsigned().nullable();
        t.integer('teacher_id').unsigned().references('id').inTable('users').nullable();
        t.datetime('start_date').nullable();
        t.datetime('end_date').nullable();
        t.boolean('is_anonymous').defaultTo(true);
        t.json('settings').nullable();
        t.timestamp('updated_at').defaultTo(knex.fn.now());
      })

      // 8. ENHANCE SURVEY_QUESTIONS TABLE
      .table('survey_questions', function(t) {
        t.integer('sort_order').defaultTo(0);
        t.boolean('is_required').defaultTo(false);
        t.text('help_text').nullable();
        t.integer('min_value').nullable().comment('For scale questions');
        t.integer('max_value').nullable().comment('For scale questions');
      })
  );
};

exports.down = function(knex) {
  return knex.schema
    .table('survey_questions', function(t) {
      t.dropColumn('sort_order');
      t.dropColumn('is_required');
      t.dropColumn('help_text');
      t.dropColumn('min_value');
      t.dropColumn('max_value');
    })
    .table('surveys', function(t) {
      t.dropColumn('course_id');
      t.dropColumn('teacher_id');
      t.dropColumn('start_date');
      t.dropColumn('end_date');
      t.dropColumn('is_anonymous');
      t.dropColumn('settings');
      t.dropColumn('updated_at');
    })
    .table('questions', function(t) {
      t.dropColumn('content_text');
      t.dropColumn('points');
      t.dropColumn('difficulty_level');
      t.dropColumn('class_level');
      t.dropColumn('correct_answer');
      t.dropColumn('learning_objective_id');
      t.dropColumn('is_active');
    })
    .dropTableIfExists('exam_answers')
    .dropTableIfExists('student_exam_attempts')
    .dropTableIfExists('exam_questions')
    .dropTableIfExists('exams')
    .dropTableIfExists('question_options');
};
