ALTER TABLE contacts ADD COLUMN score INTEGER;
ALTER TABLE contacts ADD COLUMN route TEXT;
ALTER TABLE contacts ADD COLUMN n8n_execution_id TEXT;
CREATE INDEX IF NOT EXISTS idx_contacts_route_score ON contacts(route,score DESC);
