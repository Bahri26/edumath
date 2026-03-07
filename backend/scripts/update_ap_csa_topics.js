/**
 * Script: Update AP CSA Topics
 * Purpose: Update curriculum topics starting with "Unit" to be properly labeled as:
 * - Course: "Computer Science" 
 * - Class: "AP CSA"
 * 
 * Usage: node scripts/update_ap_csa_topics.js
 */

const knex = require('../db/knex');

async function updateApCsaTopics() {
  try {
    console.log('🔍 Checking table structure...');
    
    // First, get table structure
    const columns = await knex.raw("DESCRIBE curriculum_topics");
    const columnNames = columns[0].map(c => c.Field);
    console.log('📊 curriculum_topics columns:', columnNames);
    
    // Determine which column to search in
    let searchColumn = null;
    if (columnNames.includes('name')) searchColumn = 'name';
    else if (columnNames.includes('title')) searchColumn = 'title';
    else if (columnNames.includes('topic_name')) searchColumn = 'topic_name';
    else {
      console.log('⚠️ Cannot find suitable column to search. Available:', columnNames);
      // Try getting all records to inspect
      const allTopics = await knex('curriculum_topics').select('*').limit(5);
      console.log('Sample records:', JSON.stringify(allTopics, null, 2));
      return;
    }
    
    console.log(`\n🔍 Searching for Unit topics using column: ${searchColumn}...`);
    
    // Find all topics that start with "Unit"
    const topics = await knex('curriculum_topics')
      .whereRaw(`${searchColumn} LIKE 'Unit%'`)
      .select('*');
    
    console.log(`📋 Found ${topics.length} Unit topics`);
    
    if (topics.length === 0) {
      console.log('❌ No Unit topics found. Checking all topics...');
      const allTopics = await knex('curriculum_topics').select('*').limit(10);
      console.log('First 10 topics:');
      allTopics.forEach(t => console.log(`  - ${JSON.stringify(t)}`));
      return;
    }
    
    // Display topics to be updated
    console.log('\n📝 Topics to update:');
    topics.forEach((t, i) => {
      console.log(`${i + 1}. ID: ${t.id} - ${t.name || t.title}`);
    });
    
    // Update each topic
    const updateData = {
      course: 'Computer Science',
      class: 'AP CSA',
      updated_at: new Date()
    };
    
    // Try different column names depending on schema
    let updateCount = 0;
    for (const topic of topics) {
      try {
        const updated = await knex('curriculum_topics')
          .where('id', topic.id)
          .update(updateData);
        
        if (updated) {
          updateCount++;
          console.log(`✅ Updated topic ID ${topic.id}`);
        }
      } catch (colErr) {
        // Column might not exist, try alternate update
        try {
          await knex('curriculum_topics')
            .where('id', topic.id)
            .update({
              course_name: 'Computer Science',
              class_name: 'AP CSA',
              updated_at: new Date()
            });
          updateCount++;
          console.log(`✅ Updated topic ID ${topic.id} (alternate columns)`);
        } catch (altErr) {
          console.log(`⚠️ Could not update topic ID ${topic.id}:`, altErr.message);
        }
      }
    }
    
    console.log(`\n✨ Update complete! ${updateCount}/${topics.length} topics updated`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

updateApCsaTopics();
