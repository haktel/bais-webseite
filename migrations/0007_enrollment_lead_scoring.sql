ALTER TABLE enrollment_requests ADD COLUMN score INTEGER;
ALTER TABLE enrollment_requests ADD COLUMN route TEXT;
ALTER TABLE enrollment_requests ADD COLUMN n8n_execution_id TEXT;
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_route_score ON enrollment_requests(route,score DESC);
