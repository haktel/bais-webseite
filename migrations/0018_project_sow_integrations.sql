PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS project_sow(
 project_id TEXT PRIMARY KEY,
 organization_id TEXT NOT NULL,
 offer_number TEXT,
 sow_status TEXT NOT NULL DEFAULT 'draft' CHECK(sow_status IN('draft','approved','signed')),
 project_start TEXT,
 valid_until TEXT,
 scope_json TEXT NOT NULL DEFAULT '[]',
 created_by TEXT NOT NULL,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 signed_at TEXT,
 FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
 FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
 FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_project_sow_org_status
 ON project_sow(organization_id,sow_status,updated_at DESC);

CREATE TABLE IF NOT EXISTS project_modules(
 project_id TEXT NOT NULL,
 module_code TEXT NOT NULL,
 module_name TEXT NOT NULL,
 source TEXT NOT NULL DEFAULT 'sow' CHECK(source='sow'),
 selected_by TEXT NOT NULL,
 selected_at TEXT NOT NULL,
 PRIMARY KEY(project_id,module_code),
 FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
 FOREIGN KEY(selected_by) REFERENCES users(id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_project_modules_code
 ON project_modules(module_code,project_id);

CREATE TABLE IF NOT EXISTS project_integration_links(
 project_id TEXT PRIMARY KEY,
 dolibarr_project_id INTEGER,
 dolibarr_project_ref TEXT,
 dolibarr_sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(dolibarr_sync_status IN('pending','synced','failed')),
 jira_parent_id TEXT,
 jira_parent_key TEXT,
 jira_sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(jira_sync_status IN('pending','synced','failed')),
 last_sync_at TEXT,
 last_error TEXT,
 updated_at TEXT NOT NULL,
 FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_module_integration_links(
 project_id TEXT NOT NULL,
 module_code TEXT NOT NULL,
 jira_issue_id TEXT,
 jira_issue_key TEXT,
 updated_at TEXT NOT NULL,
 PRIMARY KEY(project_id,module_code),
 FOREIGN KEY(project_id,module_code) REFERENCES project_modules(project_id,module_code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_sync_jobs(
 id TEXT PRIMARY KEY,
 project_id TEXT NOT NULL,
 target TEXT NOT NULL CHECK(target IN('dolibarr','jira')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','processing','done','failed')),
 attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at TEXT NOT NULL,
 last_error TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 UNIQUE(project_id,target),
 FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_project_sync_jobs_due
 ON project_sync_jobs(target,status,next_attempt_at,created_at);
