PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS customer_email_verifications(
 user_id TEXT PRIMARY KEY,
 token_hash TEXT NOT NULL UNIQUE,
 created_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 verified_at TEXT,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_customer_email_verifications_token
 ON customer_email_verifications(token_hash,expires_at);
