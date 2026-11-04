CREATE TABLE `manual_logs` (
	`user_id` text PRIMARY KEY NOT NULL,
	`data_json` text NOT NULL,
	`version` integer NOT NULL,
	`updated_at` integer NOT NULL
);
