CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text,
	`kind` text NOT NULL,
	`metadata_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_events_owner_idx` ON `audit_events` (`owner_id`);--> statement-breakpoint
CREATE TABLE `compiler_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`status` text NOT NULL,
	`stage` text,
	`revision` integer DEFAULT 0 NOT NULL,
	`lease_until` text,
	`payload_json` text NOT NULL,
	`error_code` text,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `compiler_runs_owner_idx` ON `compiler_runs` (`owner_id`);--> statement-breakpoint
CREATE INDEX `compiler_runs_expiry_idx` ON `compiler_runs` (`expires_at`);--> statement-breakpoint
CREATE TABLE `concept_evidence` (
	`owner_id` text NOT NULL,
	`concept_id` text NOT NULL,
	`score_micros` integer NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`practice_runs` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `concept_evidence_owner_concept_idx` ON `concept_evidence` (`owner_id`,`concept_id`);--> statement-breakpoint
CREATE TABLE `daily_usage` (
	`owner_id` text NOT NULL,
	`day` text NOT NULL,
	`maia_turns` integer DEFAULT 0 NOT NULL,
	`compiler_builds` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_usage_owner_day_idx` ON `daily_usage` (`owner_id`,`day`);--> statement-breakpoint
CREATE TABLE `generated_courses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`artifact_key` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`deleted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `generated_courses_owner_idx` ON `generated_courses` (`owner_id`);--> statement-breakpoint
CREATE TABLE `guest_claims` (
	`guest_id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`claimed_at` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `lesson_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`mode` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`state_json` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `lesson_sessions_owner_idx` ON `lesson_sessions` (`owner_id`);--> statement-breakpoint
CREATE INDEX `lesson_sessions_expiry_idx` ON `lesson_sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `session_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`payload_json` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `lesson_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `session_events_owner_idx` ON `session_events` (`owner_id`);--> statement-breakpoint
CREATE TABLE `museion_state` (
	`namespace` text NOT NULL,
	`id` text NOT NULL,
	`owner_id` text NOT NULL,
	`payload` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `museion_state_namespace_id_idx` ON `museion_state` (`namespace`,`id`);--> statement-breakpoint
CREATE INDEX `museion_state_owner_idx` ON `museion_state` (`namespace`,`owner_id`);--> statement-breakpoint
CREATE INDEX `museion_state_expiry_idx` ON `museion_state` (`expires_at`);--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`media_type` text NOT NULL,
	`byte_length` integer NOT NULL,
	`sha256` text NOT NULL,
	`status` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `uploads_owner_idx` ON `uploads` (`owner_id`);--> statement-breakpoint
CREATE INDEX `uploads_expiry_idx` ON `uploads` (`expires_at`);