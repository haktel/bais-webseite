PRAGMA foreign_keys=ON;

-- Commercial identity layer: stable customer/project numbers and provider profile.
CREATE TABLE IF NOT EXISTS business_sequences(
  sequence_key TEXT PRIMARY KEY,
  next_value INTEGER NOT NULL CHECK(next_value>=0),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_accounts(
  organization_id TEXT PRIMARY KEY,
  customer_number TEXT NOT NULL UNIQUE,
  account_status TEXT NOT NULL DEFAULT 'active' CHECK(account_status IN('active','inactive','blocked')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_accounts_number ON customer_accounts(customer_number);

CREATE TABLE IF NOT EXISTS business_profile(
  id TEXT PRIMARY KEY CHECK(id='default'),
  legal_name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  owner_name TEXT,
  street_address TEXT,
  postal_code TEXT,
  city TEXT,
  country_code TEXT NOT NULL DEFAULT 'DE',
  vat_id TEXT,
  email TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS project_registry(
  project_id TEXT PRIMARY KEY,
  project_number TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_project_registry_number ON project_registry(project_number);

INSERT OR IGNORE INTO business_profile(
 id,legal_name,brand_name,owner_name,street_address,postal_code,city,country_code,vat_id,email,updated_at
) VALUES(
 'default','BAIT Solution','BAIS – Bünyamin Atik – IT Solutions','Bünyamin Atik',
 'Kleine Burgholzstr. 11','44145','Dortmund','DE','DE815818009','info@bais-solutions.de',datetime('now')
);
