PRAGMA foreign_keys=ON;

-- CIA customer access control: explicit, organization-scoped entitlements.
-- No row means no access (default deny).
CREATE TABLE IF NOT EXISTS customer_access_grants(
 organization_id TEXT NOT NULL,
 content_key TEXT NOT NULL,
 project_id TEXT NOT NULL DEFAULT '*',
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN('active','revoked')),
 granted_by TEXT NOT NULL,
 granted_at TEXT NOT NULL,
 expires_at TEXT,
 revoked_at TEXT,
 PRIMARY KEY(organization_id,content_key,project_id),
 FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
 FOREIGN KEY(granted_by) REFERENCES users(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_customer_access_lookup
 ON customer_access_grants(organization_id,content_key,project_id,status,expires_at);
CREATE INDEX IF NOT EXISTS idx_customer_access_project
 ON customer_access_grants(project_id,status);
