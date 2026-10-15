// Versioned local SQLite schema. Existing learner tables match the D1 schema.
export const LOCAL_SCHEMA_VERSION = 2;
export const LOCAL_SCHEMA = `CREATE TABLE IF NOT EXISTS accounts (
	id text PRIMARY KEY NOT NULL,
	status text DEFAULT 'active' NOT NULL,
	created_at text NOT NULL,
	updated_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
	id text PRIMARY KEY NOT NULL,
	owner_id text,
	kind text NOT NULL,
	metadata_json text NOT NULL,
	created_at text NOT NULL
);

CREATE INDEX IF NOT EXISTS audit_events_owner_idx ON audit_events (owner_id);
CREATE TABLE IF NOT EXISTS compiler_runs (
	id text PRIMARY KEY NOT NULL,
	owner_id text NOT NULL,
	status text NOT NULL,
	stage text,
	revision integer DEFAULT 0 NOT NULL,
	lease_until text,
	payload_json text NOT NULL,
	error_code text,
	expires_at text NOT NULL,
	created_at text NOT NULL,
	updated_at text NOT NULL
);

CREATE INDEX IF NOT EXISTS compiler_runs_owner_idx ON compiler_runs (owner_id);
CREATE INDEX IF NOT EXISTS compiler_runs_expiry_idx ON compiler_runs (expires_at);
CREATE TABLE IF NOT EXISTS concept_evidence (
	owner_id text NOT NULL,
	concept_id text NOT NULL,
	score_micros integer NOT NULL,
	completed integer DEFAULT false NOT NULL,
	practice_runs integer DEFAULT 0 NOT NULL,
	updated_at text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS concept_evidence_owner_concept_idx ON concept_evidence (owner_id,concept_id);
CREATE TABLE IF NOT EXISTS daily_usage (
	owner_id text NOT NULL,
	day text NOT NULL,
	maia_turns integer DEFAULT 0 NOT NULL,
	compiler_builds integer DEFAULT 0 NOT NULL,
	updated_at text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS daily_usage_owner_day_idx ON daily_usage (owner_id,day);
CREATE TABLE IF NOT EXISTS generated_courses (
	id text PRIMARY KEY NOT NULL,
	owner_id text NOT NULL,
	title text NOT NULL,
	artifact_key text NOT NULL,
	revision integer DEFAULT 0 NOT NULL,
	deleted_at text,
	created_at text NOT NULL,
	updated_at text NOT NULL
);

CREATE INDEX IF NOT EXISTS generated_courses_owner_idx ON generated_courses (owner_id);
CREATE TABLE IF NOT EXISTS guest_claims (
	guest_id text PRIMARY KEY NOT NULL,
	account_id text NOT NULL,
	claimed_at text NOT NULL,
	FOREIGN KEY (account_id) REFERENCES accounts(id) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS lesson_sessions (
	id text PRIMARY KEY NOT NULL,
	owner_id text NOT NULL,
	lesson_id text NOT NULL,
	mode text NOT NULL,
	revision integer DEFAULT 0 NOT NULL,
	state_json text NOT NULL,
	expires_at text NOT NULL,
	created_at text NOT NULL,
	updated_at text NOT NULL
);

CREATE INDEX IF NOT EXISTS lesson_sessions_owner_idx ON lesson_sessions (owner_id);
CREATE INDEX IF NOT EXISTS lesson_sessions_expiry_idx ON lesson_sessions (expires_at);
CREATE TABLE IF NOT EXISTS session_events (
	id text PRIMARY KEY NOT NULL,
	session_id text NOT NULL,
	owner_id text NOT NULL,
	kind text NOT NULL,
	payload_json text NOT NULL,
	created_at text NOT NULL,
	FOREIGN KEY (session_id) REFERENCES lesson_sessions(id) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS session_events_owner_idx ON session_events (owner_id);
CREATE TABLE IF NOT EXISTS museion_state (
	namespace text NOT NULL,
	id text NOT NULL,
	owner_id text NOT NULL,
	payload text NOT NULL,
	expires_at text NOT NULL,
	created_at text NOT NULL,
	updated_at text NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS museion_state_namespace_id_idx ON museion_state (namespace,id);
CREATE INDEX IF NOT EXISTS museion_state_owner_idx ON museion_state (namespace,owner_id);
CREATE INDEX IF NOT EXISTS museion_state_expiry_idx ON museion_state (expires_at);
CREATE TABLE IF NOT EXISTS uploads (
	id text PRIMARY KEY NOT NULL,
	owner_id text NOT NULL,
	object_key text NOT NULL,
	filename text NOT NULL,
	media_type text NOT NULL,
	byte_length integer NOT NULL,
	sha256 text NOT NULL,
	status text NOT NULL,
	expires_at text NOT NULL,
	created_at text NOT NULL,
	updated_at text NOT NULL
);

CREATE INDEX IF NOT EXISTS uploads_owner_idx ON uploads (owner_id);
CREATE INDEX IF NOT EXISTS uploads_expiry_idx ON uploads (expires_at);
CREATE TABLE IF NOT EXISTS local_credentials (
 account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
 email TEXT NOT NULL UNIQUE,
 display_name TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_sessions (
 token_hash TEXT PRIMARY KEY,
 account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS auth_sessions_account_idx ON auth_sessions(account_id);
CREATE TABLE IF NOT EXISTS auth_attempts (
 key TEXT PRIMARY KEY,
 attempts INTEGER NOT NULL,
 window_started_at INTEGER NOT NULL
);
`;

export const AUTH_VERIFICATION_SCHEMA = `
CREATE TABLE IF NOT EXISTS pending_signups (
 id TEXT PRIMARY KEY,
 email TEXT NOT NULL UNIQUE,
 display_name TEXT NOT NULL,
 password_hash TEXT NOT NULL,
 code_hash TEXT NOT NULL,
 next_path TEXT NOT NULL,
 expires_at INTEGER NOT NULL,
 attempts INTEGER NOT NULL DEFAULT 0,
 resend_count INTEGER NOT NULL DEFAULT 0,
 last_sent_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS pending_signups_expiry_idx ON pending_signups(expires_at);
`;
