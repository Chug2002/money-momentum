CREATE TABLE `notification_events` (
	`user_id` text NOT NULL,
	`event_id` text NOT NULL,
	`data_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`delivered` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `event_id`)
);
--> statement-breakpoint
CREATE TABLE `notification_job_auth` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`last_run` integer DEFAULT 0 NOT NULL,
	`last_result` text
);
--> statement-breakpoint
CREATE TABLE `notification_seen` (
	`user_id` text NOT NULL,
	`transaction_id` text NOT NULL,
	PRIMARY KEY(`user_id`, `transaction_id`)
);
--> statement-breakpoint
CREATE TABLE `notification_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`settings_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`baseline` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subscription_json` text NOT NULL,
	`created_at` integer NOT NULL
);
