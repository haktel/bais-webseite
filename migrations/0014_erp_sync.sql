PRAGMA foreign_keys=ON;

-- Durable BAIS -> Dolibarr ERP outbox and cross-system identity map.
-- Registration stays available even when the ERP is offline; jobs are retried later.
CREATE TABLE IF NOT EXISTS erp_integration_config(
 id TEXT PRIMARY KEY CHECK(id='default'),
 base_url TEXT NOT NULL DEFAULT 'https://erp.bais-solutions.de',
 api_key_ciphertext TEXT,
 api_key_iv TEXT,
 cf_access_client_id_ciphertext TEXT,
 cf_access_client_id_iv TEXT,
 cf_access_client_secret_ciphertext TEXT,
 cf_access_client_secret_iv TEXT,
 enabled INTEGER NOT NULL DEFAULT 1 CHECK(enabled IN(0,1)),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS erp_links(
 organization_id TEXT PRIMARY KEY,
 bais_customer_number TEXT NOT NULL,
 dolibarr_thirdparty_id INTEGER,
 erp_role TEXT NOT NULL DEFAULT 'prospect' CHECK(erp_role IN('prospect','customer')),
 sync_status TEXT NOT NULL DEFAULT 'pending' CHECK(sync_status IN('pending','synced','failed')),
 remote_ref TEXT,
 last_sync_at TEXT,
 last_error TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_erp_links_customer_number
 ON erp_links(bais_customer_number);
CREATE INDEX IF NOT EXISTS idx_erp_links_status
 ON erp_links(sync_status,updated_at);

CREATE TABLE IF NOT EXISTS erp_sync_jobs(
 id TEXT PRIMARY KEY,
 organization_id TEXT NOT NULL,
 job_type TEXT NOT NULL,
 object_key TEXT NOT NULL DEFAULT '*',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','processing','done','failed')),
 attempts INTEGER NOT NULL DEFAULT 0,
 next_attempt_at TEXT NOT NULL,
 last_error TEXT,
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 UNIQUE(organization_id,job_type,object_key),
 FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_erp_sync_jobs_due
 ON erp_sync_jobs(status,next_attempt_at,created_at);
