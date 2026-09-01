PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS document_uploads(
 id TEXT PRIMARY KEY,
 organization_id TEXT NOT NULL,
 project_id TEXT NOT NULL,
 incoming_key TEXT NOT NULL UNIQUE,
 final_key TEXT,
 original_name TEXT NOT NULL,
 mime_type TEXT NOT NULL,
 declared_size INTEGER NOT NULL CHECK(declared_size>0),
 actual_size INTEGER,
 etag TEXT,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','ready','rejected')),
 created_by TEXT NOT NULL,
 created_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 finalized_at TEXT,
 rejection_reason TEXT,
 FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
 FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
 FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_document_uploads_tenant
 ON document_uploads(organization_id,project_id,status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_uploads_expiry
 ON document_uploads(status,expires_at);
