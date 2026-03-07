// Migration: Template table for backend CRUD example
exports.up = function(knex) {
  return knex.schema.createTable('template', function(t) {
    t.increments('id').primary();
    t.string('name').notNullable();
    t.text('description').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('template');
};
