PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS academy_final_exam_attempts(
 id TEXT PRIMARY KEY,
 enrollment_id TEXT NOT NULL,
 user_id TEXT NOT NULL,
 course_id TEXT NOT NULL,
 questions_json TEXT NOT NULL,
 answer_key_json TEXT NOT NULL,
 answers_json TEXT,
 score INTEGER CHECK(score BETWEEN 0 AND 100),
 status TEXT NOT NULL CHECK(status IN('in_progress','passed','failed','expired')),
 started_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 completed_at TEXT,
 FOREIGN KEY(enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_final_exam_user_course
 ON academy_final_exam_attempts(user_id,course_id,started_at DESC);

CREATE INDEX IF NOT EXISTS idx_final_exam_status_expiry
 ON academy_final_exam_attempts(status,expires_at);
