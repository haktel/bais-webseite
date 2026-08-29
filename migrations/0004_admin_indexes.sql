PRAGMA foreign_keys=ON;
CREATE INDEX IF NOT EXISTS idx_users_role_created ON users(role,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_progress_status ON course_progress(status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollment_requests_created ON enrollment_requests(created_at DESC);
