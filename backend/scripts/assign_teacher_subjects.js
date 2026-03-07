/**
 * Script: Assign subjects to teachers
 * Assigns:
 * - emre@gmail.com → Matematik
 * - bahadir26@hotmail.com → Matematik
 * - bahri@gmail.com → Computer Science
 */

const knex = require('../db/knex');

async function assignTeacherSubjects() {
  try {
    console.log('📚 Assigning subjects to teachers...\n');

    // Matematik öğretmenleri
    const mathTeachers = [
      'emre@gmail.com',
      'bahadir26@hotmail.com'
    ];

    for (const email of mathTeachers) {
      const updated = await knex('users')
        .where('email', email)
        .update({ subject: 'Matematik' });
      
      if (updated) {
        console.log(`✅ ${email} → Matematik`);
      } else {
        console.log(`⚠️ ${email} not found`);
      }
    }

    // Computer Science öğretmeni
    const csUpdated = await knex('users')
      .where('email', 'bahri@gmail.com')
      .update({ subject: 'Computer Science' });
    
    if (csUpdated) {
      console.log(`✅ bahri@gmail.com → Computer Science`);
    }

    // Verify assignments
    console.log('\n🔍 Verification:');
    const teachers = await knex('users')
      .where('role_id', 2)
      .select('user_id', 'full_name', 'email', 'subject');
    
    console.log(teachers);
    console.log('\n✨ Teacher subjects assigned successfully!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

assignTeacherSubjects();
