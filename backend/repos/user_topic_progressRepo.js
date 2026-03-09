const knex = require('../db/knex');
const TABLE = 'user_topic_progress';

async function getForUser(userId) {
  return knex(TABLE).where({ user_id: userId }).select('*');
}

async function getByUserAndTopic(userId, topicId) {
  return knex(TABLE).where({ user_id: userId, topic_id: topicId }).first();
}

// Record a review result; simple mastery algorithm: every 5 correct +1 level, every 3 wrong -1 level
async function recordReview(userId, topicId, { correct }) {
  const existing = await getByUserAndTopic(userId, topicId);
  if (existing) {
    let { correct_count = 0, wrong_count = 0, mastery_level = 0 } = existing;
    if (correct) {
      correct_count += 1;
      if (correct_count % 5 === 0 && mastery_level < 5) mastery_level += 1;
    } else {
      wrong_count += 1;
      if (wrong_count % 3 === 0 && mastery_level > 0) mastery_level -= 1;
    }
    await knex(TABLE)
      .where({ user_id: userId, topic_id: topicId })
      .update({ correct_count, wrong_count, mastery_level, last_reviewed: knex.fn.now() });
    return { user_id: userId, topic_id: topicId, correct_count, wrong_count, mastery_level };
  } else {
    const correct_count = correct ? 1 : 0;
    const wrong_count = correct ? 0 : 1;
    const mastery_level = correct ? 1 : 0;
    await knex(TABLE).insert({ user_id: userId, topic_id: topicId, correct_count, wrong_count, mastery_level, last_reviewed: knex.fn.now() });
    return { user_id: userId, topic_id: topicId, correct_count, wrong_count, mastery_level };
  }
}

module.exports = { getForUser, getByUserAndTopic, recordReview };
