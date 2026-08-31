PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS admin_mfa(
 user_id TEXT PRIMARY KEY,
 secret_ciphertext TEXT NOT NULL,
 secret_iv TEXT NOT NULL,
 enabled_at TEXT NOT NULL,
 created_at TEXT NOT NULL,
 last_counter INTEGER NOT NULL DEFAULT -1,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS admin_mfa_setup(
 user_id TEXT PRIMARY KEY,
 secret_ciphertext TEXT NOT NULL,
 secret_iv TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS admin_mfa_sessions(
 session_id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL,
 verified_at TEXT NOT NULL,
 FOREIGN KEY(session_id) REFERENCES user_sessions(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS admin_mfa_recovery_codes(
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL,
 code_hash TEXT NOT NULL UNIQUE,
 used_at TEXT,
 created_at TEXT NOT NULL,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_admin_mfa_recovery_user ON admin_mfa_recovery_codes(user_id,used_at);
