PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS user_password_resets(
 user_id TEXT PRIMARY KEY,
 token_hash TEXT NOT NULL UNIQUE,
 created_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 used_at TEXT,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_password_resets_token
 ON user_password_resets(token_hash,expires_at);
