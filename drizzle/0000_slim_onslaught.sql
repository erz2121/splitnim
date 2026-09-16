CREATE TABLE `bills` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`total_luna` integer NOT NULL,
	`recipient_address` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_bills_created_at` ON `bills` (`created_at`);--> statement-breakpoint
CREATE TABLE `participants` (
	`id` text PRIMARY KEY NOT NULL,
	`bill_id` text NOT NULL,
	`name` text NOT NULL,
	`amount_luna` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`tx_hash` text,
	`paid_at` text,
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_participants_bill_id` ON `participants` (`bill_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_participants_tx_hash` ON `participants` (`tx_hash`);