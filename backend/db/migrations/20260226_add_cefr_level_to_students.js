// Migration: Add CEFR level to students table
exports.up = function(knex) {
  return knex.schema.table('students', function(t) {
    t.string('cefr_level', 4).nullable().comment('A1, A2, B1, B2, C1, C2');
  });
};

exports.down = function(knex) {
  return knex.schema.table('students', function(t) {
    t.dropColumn('cefr_level');
  });
};
