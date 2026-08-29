CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id,issued_at);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON certificates(course_id,issued_at);
