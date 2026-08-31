PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS privacy_retention(
 entity_type TEXT NOT NULL,
 entity_id TEXT NOT NULL,
 delete_after TEXT,
 legal_hold INTEGER NOT NULL DEFAULT 0 CHECK(legal_hold IN(0,1)),
 reason TEXT,
 updated_at TEXT NOT NULL,
 PRIMARY KEY(entity_type,entity_id)
);
CREATE INDEX IF NOT EXISTS idx_privacy_retention_due ON privacy_retention(legal_hold,delete_after);

CREATE TABLE IF NOT EXISTS privacy_requests(
 id TEXT PRIMARY KEY,
 user_id TEXT,
 email TEXT NOT NULL,
 request_type TEXT NOT NULL CHECK(request_type IN('access','deletion','rectification','restriction','objection','portability')),
 status TEXT NOT NULL DEFAULT 'open' CHECK(status IN('open','in_progress','completed','rejected')),
 note TEXT,
 created_at TEXT NOT NULL,
 resolved_at TEXT,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON privacy_requests(status,created_at DESC);
