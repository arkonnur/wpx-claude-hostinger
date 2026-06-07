CREATE TABLE `otp_challenges` (
	`id` varchar(36) NOT NULL,
	`phone_hash` varchar(64) NOT NULL,
	`code_hash` varchar(64) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`attempts` int NOT NULL DEFAULT 0,
	`consumed` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `otp_challenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `otp_challenges_phone_ix` ON `otp_challenges` (`phone_hash`,`created_at`);