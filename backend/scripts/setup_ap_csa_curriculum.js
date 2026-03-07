/**
 * Script: Setup AP CSA Curriculum Topics
 * Purpose: Create curriculum_topics entries for each AP CSA Unit and link them
 * Tag them as: Course = Computer Science, Class = AP CSA
 */

const knex = require('../db/knex');

async function setupApCsaTopics() {
  try {
    console.log('🔍 Finding all Unit topics from questions...');
    
    // Get all distinct Unit topics from questions
    const unitTopics = await knex('questions')
      .where('topic', 'like', 'Unit%')
      .distinct('topic')
      .select('topic')
      .orderBy('topic');
    
    console.log(`📋 Found ${unitTopics.length} unique Unit topics:\n`);
    unitTopics.forEach(t => console.log(`  ✓ ${t.topic}`));
    
    // Create/update curriculum_topics for each Unit
    console.log('\n\n📝 Setting up curriculum_topics...\n');
    
    for (const unitTopic of unitTopics) {
      const topicName = unitTopic.topic;
      
      try {
        // Check if this topic already exists
        const existing = await knex('curriculum_topics')
          .where('topic_name', topicName)
          .first();
        
        if (existing) {
          // Update existing
          await knex('curriculum_topics')
            .where('topic_name', topicName)
            .update({
              unit_name: 'AP Computer Science A',
              grade_level: 10, // 10th grade typically for AP CSA
              lesson_id: 1 // AP CSA course ID
            });
          console.log(`✅ Updated: ${topicName}`);
        } else {
          // Create new
          await knex('curriculum_topics').insert({
            lesson_id: 1,
            grade_level: 10,
            unit_name: 'AP Computer Science A',
            topic_name: topicName
          });
          console.log(`✨ Created: ${topicName}`);
        }
      } catch (err) {
        console.log(`⚠️  Could not process ${topicName}: ${err.message.substring(0, 60)}`);
      }
    }
    
    // Now update questions table to add course and class info
    console.log('\n\n🏷️  Tagging questions with course and class...\n');
    
    const updatedCount = await knex('questions')
      .where('topic', 'like', 'Unit%')
      .update({
        class_level: 10, // AP CSA typically grade 10+
        grade_level: 10
      });
    
    console.log(`✅ Tagged ${updatedCount} questions with class_level=10 (AP CSA)`);
    
    // Verify results
    console.log('\n\n📊 Verification - Questions tagged with Unit topics:');
    const result = await knex('questions')
      .where('topic', 'like', 'Unit%')
      .select('question_id', 'topic', 'class_level', 'grade_level')
      .limit(5);
    
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n\n✨ AP CSA topics setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

setupApCsaTopics();
