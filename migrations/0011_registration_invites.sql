PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS academy_registration_invites(
 id TEXT PRIMARY KEY,
 enrollment_request_id TEXT NOT NULL,
 email TEXT NOT NULL,
 course_id TEXT NOT NULL,
 token_hash TEXT NOT NULL UNIQUE,
 expires_at TEXT NOT NULL,
 used_at TEXT,
 created_by TEXT,
 created_at TEXT NOT NULL,
 FOREIGN KEY(enrollment_request_id) REFERENCES enrollment_requests(id) ON DELETE CASCADE,
 FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
 FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_academy_invites_request ON academy_registration_invites(enrollment_request_id,expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_academy_invites_email ON academy_registration_invites(email,expires_at DESC);
