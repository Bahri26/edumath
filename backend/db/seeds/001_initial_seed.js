const { v4: uuidv4 } = require('uuid');

exports.seed = async function(knex) {
  // Deletes ALL existing entries (safe for initial seed)
  await knex('responses').del().catch(() => {});
  await knex('sessions').del().catch(() => {});
  await knex('interventions').del().catch(() => {});
  await knex('consents').del().catch(() => {});
  await knex('questions').del().catch(() => {});
  await knex('students').del().catch(() => {});
  await knex('users').del().catch(() => {});

  // Insert admin user
  const [adminId] = await knex('users').insert({
    role: 'admin',
    name: 'Pilot Admin',
    email_hash: 'admin@example.com',
  }).returning('id');

  // Insert a sample teacher
  const [teacherId] = await knex('users').insert({
    role: 'teacher',
    name: 'Pilot Teacher',
    email_hash: 'teacher@example.com',
  }).returning('id');

  // Insert sample student user and student record
  const [studentUserId] = await knex('users').insert({
    role: 'student',
    name: 'Sample Student',
    email_hash: 'student1@example.com',
  }).returning('id');

  await knex('students').insert({
    user_id: studentUserId,
    anon_id: uuidv4(),
    demographic: JSON.stringify({grade: '6', locale: 'TR'})
  });

  // Insert a few sample questions
  await knex('questions').insert([
    {
      stem: 'Bir sayının iki katı 14 ise sayı kaçtır?',
      type: 'multiple_choice',
      estimated_time_ms: 20000,
      difficulty_label: 'A1',
      source: 'internal',
      license: 'internal'
    },
    {
      stem: 'Aşağıdaki şekillerden hangisi simetrik değildir?',
      type: 'multiple_choice',
      estimated_time_ms: 30000,
      difficulty_label: 'A2',
      source: 'internal',
      license: 'internal'
    },
    {
      stem: 'Verilen dizi 2, 4, 8, ? bir sonraki sayı hangi kural ile bulunur?',
      type: 'open',
      estimated_time_ms: 45000,
      difficulty_label: 'B1',
      source: 'internal',
      license: 'internal'
    }
  ]);
};
