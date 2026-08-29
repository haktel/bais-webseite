PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS user_credentials(
 user_id TEXT PRIMARY KEY,
 password_hash TEXT NOT NULL,
 password_salt TEXT NOT NULL,
 password_algorithm TEXT NOT NULL,
 password_iterations INTEGER NOT NULL,
 updated_at TEXT NOT NULL,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS user_sessions(
 id TEXT PRIMARY KEY,
 user_id TEXT NOT NULL,
 token_hash TEXT NOT NULL UNIQUE,
 created_at TEXT NOT NULL,
 last_seen_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 user_agent_hash TEXT,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expiry ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id,expires_at DESC);

CREATE TABLE IF NOT EXISTS auth_rate_limits(
 id TEXT PRIMARY KEY,
 attempts INTEGER NOT NULL,
 window_started_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS course_progress(
 user_id TEXT NOT NULL,
 course_id TEXT NOT NULL,
 progress_percent INTEGER NOT NULL DEFAULT 0 CHECK(progress_percent BETWEEN 0 AND 100),
 status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN('not_started','in_progress','completed')),
 updated_at TEXT NOT NULL,
 PRIMARY KEY(user_id,course_id),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO courses(id,slug,title,description,status,created_at,updated_at) VALUES
('course-ki-fuehrerschein','ki-fuehrerschein','KI-Führerschein Essentials','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-ki-leadership','ki-leadership','KI-Führerschein Leadership','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-ki-it-security','ki-it-security','KI-Führerschein IT & Security','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-data-literacy','data-literacy','Datenkompetenz für AI','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-prompt-engineering','prompt-engineering','Prompt Engineering Professional','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-secure-ai-rag','secure-ai-rag','Secure AI & RAG','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-ai-agents','ai-agents','AI Agents & Workflow Labs','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-enterprise-tools','enterprise-tools','ChatGPT, Copilot & Gemini','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-n8n-bootcamp','n8n-bootcamp','n8n Automation Bootcamp','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-ai-coding','ai-coding','AI-gestützte Softwareentwicklung','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-api-integration','api-integration','APIs, Webhooks & Systemintegration','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-knowledge-assistant-lab','knowledge-assistant-lab','Knowledge Assistant Lab','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-ai-governance','ai-governance','AI Governance Essentials','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-eu-ai-act','eu-ai-act','AI Literacy & EU AI Act Awareness','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-caio-masterguide','caio-masterguide','CAIO Masterguide','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-policy-enablement','policy-enablement','AI Policy Enablement','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-ai-for-sales','ai-for-sales','AI for Sales & B2B Vertrieb','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-ai-customer-service','ai-customer-service','AI im Kundenservice','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-prozessanalyse-automation','prozessanalyse-automation','Prozessanalyse & Automation Discovery','BAIS Academy Programm','published',datetime('now'),datetime('now')),
('course-it-projektmanagement-ai-delivery','it-projektmanagement-ai-delivery','IT-Projektmanagement & AI Delivery','BAIS Academy Programm','published',datetime('now'),datetime('now'));

INSERT OR IGNORE INTO course_runs(id,course_id,title,status,created_at) VALUES
('run-ki-fuehrerschein-self-paced','course-ki-fuehrerschein','KI-Führerschein Essentials · Self-paced','open',datetime('now')),
('run-ki-leadership-self-paced','course-ki-leadership','KI-Führerschein Leadership · Self-paced','open',datetime('now')),
('run-ki-it-security-self-paced','course-ki-it-security','KI-Führerschein IT & Security · Self-paced','open',datetime('now')),
('run-data-literacy-self-paced','course-data-literacy','Datenkompetenz für AI · Self-paced','open',datetime('now')),
('run-prompt-engineering-self-paced','course-prompt-engineering','Prompt Engineering Professional · Self-paced','open',datetime('now')),
('run-secure-ai-rag-self-paced','course-secure-ai-rag','Secure AI & RAG · Self-paced','open',datetime('now')),
('run-ai-agents-self-paced','course-ai-agents','AI Agents & Workflow Labs · Self-paced','open',datetime('now')),
('run-enterprise-tools-self-paced','course-enterprise-tools','ChatGPT, Copilot & Gemini · Self-paced','open',datetime('now')),
('run-n8n-bootcamp-self-paced','course-n8n-bootcamp','n8n Automation Bootcamp · Self-paced','open',datetime('now')),
('run-ai-coding-self-paced','course-ai-coding','AI-gestützte Softwareentwicklung · Self-paced','open',datetime('now')),
('run-api-integration-self-paced','course-api-integration','APIs, Webhooks & Systemintegration · Self-paced','open',datetime('now')),
('run-knowledge-assistant-lab-self-paced','course-knowledge-assistant-lab','Knowledge Assistant Lab · Self-paced','open',datetime('now')),
('run-ai-governance-self-paced','course-ai-governance','AI Governance Essentials · Self-paced','open',datetime('now')),
('run-eu-ai-act-self-paced','course-eu-ai-act','AI Literacy & EU AI Act Awareness · Self-paced','open',datetime('now')),
('run-caio-masterguide-self-paced','course-caio-masterguide','CAIO Masterguide · Self-paced','open',datetime('now')),
('run-policy-enablement-self-paced','course-policy-enablement','AI Policy Enablement · Self-paced','open',datetime('now')),
('run-ai-for-sales-self-paced','course-ai-for-sales','AI for Sales & B2B Vertrieb · Self-paced','open',datetime('now')),
('run-ai-customer-service-self-paced','course-ai-customer-service','AI im Kundenservice · Self-paced','open',datetime('now')),
('run-prozessanalyse-automation-self-paced','course-prozessanalyse-automation','Prozessanalyse & Automation Discovery · Self-paced','open',datetime('now')),
('run-it-projektmanagement-ai-delivery-self-paced','course-it-projektmanagement-ai-delivery','IT-Projektmanagement & AI Delivery · Self-paced','open',datetime('now'));
