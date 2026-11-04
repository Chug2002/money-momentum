CREATE TABLE `plaid_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_cipher` text NOT NULL,
	`environment` text NOT NULL,
	`institution` text NOT NULL,
	`accounts_json` text DEFAULT '[]' NOT NULL,
	`cursor` text,
	`synced_at` integer DEFAULT 0 NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'connected' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plaid_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plaid_transactions` (
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`transaction_id` text NOT NULL,
	`data_json` text NOT NULL,
	`date` text NOT NULL,
	PRIMARY KEY(`user_id`, `item_id`, `transaction_id`)
);
