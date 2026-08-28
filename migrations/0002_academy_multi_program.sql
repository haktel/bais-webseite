PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS enrollment_request_interests(
 id TEXT PRIMARY KEY,
 request_id TEXT NOT NULL,
 course_id TEXT NOT NULL,
 interest_type TEXT NOT NULL CHECK(interest_type IN('primary','additional')),
 created_at TEXT NOT NULL,
 UNIQUE(request_id,course_id),
 FOREIGN KEY(request_id) REFERENCES enrollment_requests(id) ON DELETE CASCADE,
 FOREIGN KEY(course_id) REFERENCES courses(id)
);
CREATE INDEX IF NOT EXISTS idx_enrollment_interests_request ON enrollment_request_interests(request_id,interest_type);
CREATE INDEX IF NOT EXISTS idx_enrollment_interests_course ON enrollment_request_interests(course_id,created_at DESC);

CREATE TABLE IF NOT EXISTS enrollment_request_preferences(
 request_id TEXT PRIMARY KEY,
 delivery_mode TEXT NOT NULL CHECK(delivery_mode IN('self-paced','live-online','onsite','blended')),
 participants INTEGER NOT NULL CHECK(participants BETWEEN 1 AND 50),
 indicative_price_cents INTEGER NOT NULL,
 currency TEXT NOT NULL DEFAULT 'EUR',
 created_at TEXT NOT NULL,
 FOREIGN KEY(request_id) REFERENCES enrollment_requests(id) ON DELETE CASCADE
);