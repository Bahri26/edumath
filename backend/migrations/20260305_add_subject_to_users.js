/**
 * Migration: Add subject/branch field to users table
 * Date: 2026-03-05
 * 
 * Adds subject column to track teacher's branch (Matematik, Bilgisayar Bilimleri, etc.)
 */

exports.up = async function(knex) {
  // Add subject column to users table if it doesn't exist
  const hasColumn = await knex.schema.hasColumn('users', 'subject');
  if (!hasColumn) {
    await knex.schema.alterTable('users', function(table) {
      table.enum('subject', [
        'Matematik',
        'Computer Science',
        'Bilgisayar Bilimleri',
        'English',
        'Turkish',
        'Science',
        'Social Studies',
        'Other'
      ]).nullable().defaultTo(null).comment('Teacher subject/branch');
      
      table.index('subject');
    });
  }
};

exports.down = async function(knex) {
  // Rollback: drop subject column
  const hasColumn = await knex.schema.hasColumn('users', 'subject');
  if (hasColumn) {
    await knex.schema.alterTable('users', function(table) {
      table.dropColumn('subject');
    });
  }
};
