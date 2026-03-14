const adaptiveLearningService = require('../services/adaptiveLearningService');

describe('Adaptive learning service', () => {
  test('buildQuestionQuery returns a chainable knex query builder', () => {
    const query = adaptiveLearningService.__testables.buildQuestionQuery({
      topics: ['Oruntuler'],
      skillKeys: ['oruntuler_temel'],
      excludeIds: [1, 2],
      difficultyBand: 1
    });

    expect(query).toBeTruthy();
    expect(typeof query.limit).toBe('function');
    expect(() => query.limit(1).toSQL()).not.toThrow();
  });

  test('activity-based completion gate requires mastery thresholds even at C2 XP', () => {
    const levelState = adaptiveLearningService.__testables.buildLevelState({
      xpTotal: 1300,
      skillRows: [
        { mastery_score: 90 },
        { mastery_score: 88 },
        { mastery_score: 84 },
        { mastery_score: 79 }
      ],
      dueReviews: [{ skill_key: 'pattern.rule-inference' }]
    });

    const completion = adaptiveLearningService.__testables.buildCompletionState(levelState);

    expect(levelState.currentStage.code).toBe('C2');
    expect(levelState.masteryGateMet).toBe(false);
    expect(completion.isCompleted).toBe(false);
  });

  test('estimateActivityXp returns a positive value for lesson activities', () => {
    const xp = adaptiveLearningService.__testables.estimateActivityXp({
      isCorrect: true,
      difficultyLevel: 2,
      hintUsed: false,
      attemptNo: 1,
      scoreRatio: 1
    });

    expect(xp).toBeGreaterThan(0);
  });
});