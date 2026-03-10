# EduMath Adaptive Learning Roadmap

## 1. Current State

EduMath already has AI-assisted features, but it does not yet have a true adaptive learning engine.

What exists today:

- Gemini-backed endpoints for hinting, mistake analysis, companion feedback, and content generation.
- Learning path assembly from past exam attempts.
- Weak-topic detection based on historical correctness percentages.
- Topic-level mastery tracking with a simple counter model.
- Daily quest and recommendation UI on the student side.

What is missing:

- Persistent lesson sequencing like Duolingo.
- Difficulty calibration like DataCamp.
- Spaced repetition / review scheduling.
- A real mastery model per concept or sub-skill.
- A next-best-action engine that chooses the best activity for the learner.
- Event telemetry for measuring what actually improves student outcomes.

Bottom line: the current system is AI-enabled, but not yet algorithmically adaptive.

## 2. Target Product Behavior

The target experience should work like this:

1. The student is placed at a starting level from survey, exam, or placement test.
2. The system decomposes learning into skills or subtopics, not only broad topics.
3. Each student gets a dynamic path that decides whether the next activity should be:
   - concept explanation,
   - guided example,
   - flashcard review,
   - fill-in-the-blank,
   - multiple-choice practice,
   - challenge question,
   - revision of a previously failed concept.
4. Every answer updates a mastery estimate.
5. Review timing is based on forgetting risk, not only current score.
6. The app shows streak, XP, mastery bars, locked/unlocked units, and milestone celebration.
7. Gemini is used as a teaching layer, not as the core decision-maker.

## 3. Recommended Architecture

### 3.1 Separation of Responsibilities

Use three layers:

- Decision engine:
  - decides what the learner should do next.
  - deterministic and testable.
- Content engine:
  - fetches existing questions, flashcards, and exercises.
  - asks Gemini only when needed for explanation, hint, or generated variants.
- Experience layer:
  - renders lesson units, progress bars, streaks, rewards, and review queues.

Gemini should not decide mastery or progression directly. It should produce educational content that the deterministic engine plugs into the path.

### 3.2 Concept Graph

Move from broad `topic` to skill-level progression.

Recommended hierarchy:

- curriculum
- topic
- subtopic
- skill
- activity

Example for `Örüntüler`:

- Topic: `Sayı ve Şekil Örüntüleri`
- Skills:
  - identify repeating unit
  - continue arithmetic pattern
  - infer rule from sequence
  - detect non-member item
  - translate rule into expression

This is required because adaptive learning works on fine-grained skill estimates, not only on topic averages.

## 4. Data Model Additions

Add these tables before expanding the product behavior.

### 4.1 `learner_skill_state`

Purpose: persistent mastery state per student and skill.

Suggested columns:

- `id`
- `user_id`
- `skill_id`
- `mastery_score` decimal(5,2) default 0
- `confidence_score` decimal(5,2) default 0
- `last_seen_at`
- `last_correct_at`
- `correct_count`
- `wrong_count`
- `streak_correct`
- `streak_wrong`
- `review_due_at`
- `current_difficulty_band` tinyint default 1
- unique (`user_id`, `skill_id`)

### 4.2 `learner_activity_events`

Purpose: raw event stream for analytics and future ML.

Suggested columns:

- `id`
- `user_id`
- `activity_type` (`mcq`, `flashcard`, `fill_blank`, `explanation`, `lesson`, `challenge`)
- `question_id` nullable
- `skill_id` nullable
- `topic_id` nullable
- `is_correct`
- `time_spent_ms`
- `hint_used`
- `attempt_no`
- `difficulty_level`
- `source` (`bank`, `generated`, `review_queue`, `lesson_path`)
- `created_at`

### 4.3 `question_skill_map`

Purpose: map questions to exact skill nodes.

Suggested columns:

- `id`
- `question_id`
- `skill_id`
- `weight`

### 4.4 `question_calibration`

Purpose: persistent difficulty and discrimination estimates.

Suggested columns:

- `question_id`
- `empirical_difficulty`
- `empirical_success_rate`
- `avg_time_ms`
- `hint_rate`
- `attempt_count`
- `last_recalculated_at`

### 4.5 `learner_streaks`

Purpose: real streak, XP, and lesson progression.

Suggested columns:

- `user_id`
- `daily_streak`
- `longest_streak`
- `xp_total`
- `current_level`
- `last_active_date`
- `hearts_remaining` nullable if you want Duolingo-like friction

## 5. Algorithm Roadmap

## Phase 1: Production-Safe Heuristic Engine

This is the recommended first real version because it fits the current Node/Knex architecture and can ship quickly.

### 5.1 Mastery Update Formula

For every activity result, update skill mastery using weighted increments.

Example:

$$
mastery_{new} = mastery_{old} + correctnessWeight + difficultyWeight + speedWeight - decayPenalty
$$

Practical rule version:

- correct on easy: `+2`
- correct on medium: `+3`
- correct on hard: `+4`
- wrong on easy: `-3`
- wrong on medium: `-2`
- wrong on hard: `-1`
- hint used: subtract `1`
- second try success: halve the positive gain

Cap mastery into `[0, 100]`.

Confidence score should increase when the learner answers the same skill correctly over multiple separate sessions.

### 5.2 Review Scheduling

Use a simple review scheduler before full spaced repetition.

Suggested mapping:

- mastery < 35: review in 1 day
- mastery 35-60: review in 3 days
- mastery 60-80: review in 7 days
- mastery > 80 and high confidence: review in 14 days

If the learner fails a review, move `review_due_at` closer immediately.

### 5.3 Next Best Activity Score

Choose the next activity by ranking candidates with a score.

$$
priority = weakSkillScore + dueReviewScore + curriculumUrgency + engagementBoost - repetitionPenalty
$$

Use these inputs:

- weak skill status
- time since last review
- curriculum priority
- whether the learner recently failed the skill
- whether the learner is bored with the same activity type

This should produce actions like:

- `review flashcard`
- `watch short explanation`
- `solve guided example`
- `take challenge quiz`

### 5.4 Difficulty Band Selection

Use a rolling rule:

- 3 correct in a row on same skill: increase difficulty band
- 2 wrong in a row: decrease difficulty band
- if confidence is low, keep same band longer

This is much more realistic than the current `every 5 correct => +1 level` logic.

## Phase 2: Better Statistical Models

Once Phase 1 data is collected, add stronger models.

### 5.5 Bayesian Knowledge Tracing for Skill Mastery

Use BKT to estimate probability that the learner has mastered a skill.

Track parameters:

- prior knowledge
- learn probability
- slip probability
- guess probability

This fits education well and is a clean next step after heuristic scoring.

### 5.6 Item Response Theory for Question Calibration

Use IRT to estimate:

- question difficulty
- discrimination
- learner ability

This improves question targeting and helps avoid serving questions that are too easy or too hard.

## Phase 3: Advanced Optimization

Only after sufficient event data exists.

### 5.7 Contextual Bandit / Reinforcement Layer

Use a contextual bandit to choose the activity type most likely to improve retention or completion.

Possible reward signals:

- next-day return
- correct answer after explanation
- session completion
- streak continuation
- review retention after 7 days

This is the layer that starts to resemble professional adaptive platforms.

## 6. Where Gemini Should Be Used

Gemini should support learning, not own the logic.

Recommended AI responsibilities:

- produce concise explanations for the current skill
- generate hints aligned to the student’s likely misconception
- generate simpler or harder variants of an existing validated question
- convert a concept into flashcards or fill-in-the-blank exercises
- produce encouragement text and study coach summaries

Do not use Gemini as the source of truth for:

- mastery score
- learner level
- next skill unlock
- exam readiness decision
- review timing

## 7. Required Backend Changes

### 7.1 Refactor Learning Path Controller

Current file:

- `backend/controllers/learning_pathsController.js`

Problem:

- It mixes data fetching, recommendation logic, daily quests, and AI coach generation in one controller.

Target split:

- `backend/services/adaptive/masteryService.js`
- `backend/services/adaptive/reviewScheduler.js`
- `backend/services/adaptive/recommendationService.js`
- `backend/services/adaptive/lessonPlanner.js`
- `backend/services/ai/learningContentService.js`

Controller should orchestrate only.

### 7.2 New Endpoints

Recommended endpoints:

- `GET /api/learning-path`
  - return current unit, weak skills, due reviews, recommended next lesson.
- `POST /api/learning-events`
  - record one event from any activity.
- `GET /api/learning/review-queue`
  - return items due for review.
- `GET /api/learning/next`
  - next best action for the learner.
- `POST /api/learning/answer`
  - submit answer, update mastery, return next recommendation.
- `GET /api/learning/units`
  - lesson map with locked/unlocked states.
- `GET /api/learning/skill-state`
  - frontend-friendly mastery breakdown.

### 7.3 Question Selection Service

Move selection logic out of controllers.

Required service behavior:

- choose only validated questions
- filter by skill and calibrated difficulty
- avoid recently seen items
- mix `bank questions` and `AI-generated variants`
- ensure pedagogical progression: easy -> medium -> transfer/challenge

### 7.4 Event Ingestion

Every answer should record:

- correctness
- latency
- hint usage
- retries
- content type
- skill tag

Without this telemetry, you cannot evolve toward stronger algorithms.

## 8. Required Frontend Changes

### 8.1 Learning Path Page

Current page:

- `frontend/src/pages/student/LearningPathPage.jsx`

Change it from a dashboard to an actionable lesson launcher.

Add sections:

- `Continue Lesson`
- `Due Reviews`
- `Weak Skills`
- `Daily Goal`
- `XP and level`
- `Recent wins`

### 8.2 Topic Page

Current page:

- `frontend/src/pages/student/TopicPage.jsx`

Extend it to show:

- skill mastery chips
- active difficulty band
- last review date
- review due state
- activity tabs with true completion tracking

### 8.3 Daily Quest Component

Current file:

- `frontend/src/components/student/DailyQuest.jsx`

Needed fixes:

- remove hard-coded streak text
- persist completion server-side
- get a next item from `/api/learning/next`
- show XP gain and mastery gain after each answer
- show review vs practice labeling clearly

### 8.4 New Components

Add:

- `SkillMasteryCard`
- `ReviewQueuePanel`
- `LessonUnitMap`
- `XpLevelHeader`
- `SessionSummaryModal`
- `UnlockCelebration`

## 9. Phased Delivery Plan

## Sprint 1

- Add `skill` model and `question_skill_map`.
- Add `learner_activity_events` and `learner_skill_state`.
- Replace simple topic progress logic with mastery score update service.
- Persist daily quest completion and streak state.
- Add `GET /api/learning/next` and `POST /api/learning/answer`.

Definition of done:

- every answer updates mastery and logs an event.
- frontend can ask for next action.

## Sprint 2

- Add review scheduler.
- Add due-review queue.
- Add XP, level, and unlock rules.
- Redesign learning path page around lessons and reviews.

Definition of done:

- user sees real next lesson, review items, and streak progress.

## Sprint 3

- Add difficulty calibration from observed success rates.
- Add question recency filtering and difficulty band logic.
- Improve Gemini prompts with learner context.

Definition of done:

- question selection is targeted, not random.

## Sprint 4

- Add BKT or another statistical mastery model.
- Add analytics dashboard for learning effectiveness.
- Run A/B tests on explanation-first vs practice-first flows.

Definition of done:

- measurable uplift in completion, retention, or correctness.

## 10. Success Metrics

Track these from the start:

- day-1, day-7, day-30 retention
- average session length
- lesson completion rate
- review completion rate
- mastery gain per week
- correctness after explanation
- repeat error rate on same skill
- streak continuation rate
- AI explanation usage vs success improvement

If these metrics are not logged, adaptive claims remain anecdotal.

## 11. Immediate Priority Recommendation

If only one implementation track can start now, do this order:

1. event logging
2. skill model
3. mastery service
4. review scheduler
5. next-best-action endpoint
6. frontend lesson map and XP layer
7. stronger statistical models

This order fits the current EduMath codebase and minimizes rewrite risk.

## 12. Final Recommendation

Do not position Gemini as the adaptive engine.

Position the system as:

- deterministic adaptive learning core
- AI teaching assistant on top
- measurable progression with mastery, review, and difficulty targeting

That is the shortest path from the current codebase to a professional personalized learning product.