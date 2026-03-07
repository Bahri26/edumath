-- Index suggestions for Edumath
CREATE INDEX IF NOT EXISTS idx_exams_creator_id ON exams (creator_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_user_id ON user_exam_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_exam_id ON user_exam_attempts (exam_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments (course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_courses_creator_id ON courses (creator_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses (survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses (user_id);
CREATE INDEX IF NOT EXISTS idx_student_attempts_user_id ON student_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_student_answers_attempt_id ON student_answers (attempt_id);
