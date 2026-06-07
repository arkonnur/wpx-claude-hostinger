CREATE TABLE `anonymous_sessions` (
	`id` varchar(36) NOT NULL,
	`session_id` varchar(64) NOT NULL,
	`tenant_id` varchar(36),
	`profile` json,
	`source` varchar(80),
	`utm` json,
	`merged_contact_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anonymous_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `anon_sessions_ux` UNIQUE(`session_id`)
);
--> statement-breakpoint
CREATE TABLE `appointments` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`lead_id` varchar(36) NOT NULL,
	`scheduled_date` timestamp,
	`assigned_to` varchar(36),
	`status` enum('scheduled','confirmed','in_progress','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`actor_id` varchar(36),
	`action` varchar(80) NOT NULL,
	`entity` varchar(80),
	`entity_id` varchar(36),
	`before` json,
	`after` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bans` (
	`id` varchar(36) NOT NULL,
	`ip` varchar(64),
	`device_id` varchar(64),
	`user_id` varchar(36),
	`reason` varchar(255),
	`strike_count` int NOT NULL DEFAULT 1,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brand_specs` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`name` varchar(120) NOT NULL,
	`spec` json,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_specs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_events` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`contact_id` varchar(36),
	`session_id` varchar(64),
	`type` varchar(60) NOT NULL,
	`payload` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`name` varchar(191),
	`phone` varchar(20),
	`phone_hash` varchar(64),
	`email` varchar(191),
	`address` text,
	`latitude` decimal(10,7),
	`longitude` decimal(10,7),
	`verified_at` timestamp,
	`has_account` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `estimates` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`contact_id` varchar(36),
	`lead_id` varchar(36),
	`session_id` varchar(64),
	`source` enum('calculator','ai','boq') NOT NULL DEFAULT 'calculator',
	`inputs` json,
	`result` json,
	`config_version` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `estimates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `execution_items` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`job_id` varchar(36) NOT NULL,
	`zone` varchar(80) NOT NULL,
	`label` varchar(191) NOT NULL,
	`status` enum('pending','done','na') NOT NULL DEFAULT 'pending',
	`material` varchar(191),
	`batch_no` varchar(80),
	`quantity` varchar(40),
	`coverage` varchar(80),
	`crew` varchar(191),
	`weather` varchar(80),
	`photos` json,
	`qa_verified` boolean NOT NULL DEFAULT false,
	`qa_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `execution_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `formula_sets` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`version` varchar(64) NOT NULL,
	`fingerprint` varchar(32),
	`formulas` json,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `formula_sets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `geocode_cache` (
	`id` varchar(36) NOT NULL,
	`lat_key` varchar(16) NOT NULL,
	`lng_key` varchar(16) NOT NULL,
	`address` text,
	`raw` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `geocode_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `geocode_cache_ux` UNIQUE(`lat_key`,`lng_key`)
);
--> statement-breakpoint
CREATE TABLE `inspection_photos` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`inspection_id` varchar(36) NOT NULL,
	`url` varchar(512) NOT NULL,
	`zone` varchar(80),
	`caption` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inspection_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inspections` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`lead_id` varchar(36),
	`appointment_id` varchar(36),
	`inspector_id` varchar(36),
	`status` enum('draft','in_progress','completed','report_ready') NOT NULL DEFAULT 'draft',
	`moisture_points` json,
	`slope_points` json,
	`soundness` json,
	`cracks` json,
	`defects` json,
	`readings` json,
	`signature` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inspections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`inspection_id` varchar(36),
	`quote_id` varchar(36),
	`contact_id` varchar(36),
	`assigned_to` varchar(36),
	`status` enum('scheduled','mobilising','in_progress','qa','handover','warranty_issued','cancelled') NOT NULL DEFAULT 'scheduled',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`contact_id` varchar(36),
	`service` varchar(40),
	`severity` varchar(20),
	`area_sqft` int,
	`status` enum('new','contacted','site_visit_scheduled','quoted','converted','lost') NOT NULL DEFAULT 'new',
	`source` varchar(80),
	`utm` json,
	`estimated_value` decimal(12,2),
	`score` int,
	`score_tier` enum('hot','warm','cold'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `master_reports` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`contact_id` varchar(36),
	`session_id` varchar(64),
	`sections` json,
	`completeness` int NOT NULL DEFAULT 0,
	`health_score` int,
	`lead_score` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `master_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`role` enum('owner','admin','employee','client') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `memberships_ux` UNIQUE(`user_id`,`tenant_id`,`role`)
);
--> statement-breakpoint
CREATE TABLE `org_settings` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`key` varchar(80) NOT NULL,
	`value` json,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `org_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `org_settings_ux` UNIQUE(`tenant_id`,`key`)
);
--> statement-breakpoint
CREATE TABLE `otp_log` (
	`id` varchar(36) NOT NULL,
	`phone_hash` varchar(64) NOT NULL,
	`ip` varchar(64),
	`device_id` varchar(64),
	`status` enum('sent','verified','failed','blocked') NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `otp_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `phone_registry` (
	`id` varchar(36) NOT NULL,
	`phone_hash` varchar(64) NOT NULL,
	`verified_at` timestamp,
	`has_account` boolean NOT NULL DEFAULT false,
	`risk_flags` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `phone_registry_id` PRIMARY KEY(`id`),
	CONSTRAINT `phone_registry_ux` UNIQUE(`phone_hash`)
);
--> statement-breakpoint
CREATE TABLE `photo_analyses` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`contact_id` varchar(36),
	`phash` varchar(64),
	`url` varchar(512),
	`is_waterproofing_surface` boolean,
	`result` json,
	`rejected` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photo_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `price_lists` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`version` varchar(64) NOT NULL,
	`rates` json,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `price_lists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`brand` varchar(120) NOT NULL,
	`name` varchar(191) NOT NULL,
	`category` varchar(80),
	`coverage_value` decimal(10,3),
	`coverage_unit` varchar(20),
	`pack_size` decimal(10,3),
	`pack_unit` varchar(20),
	`mrp` decimal(12,2),
	`cost_price` decimal(12,2),
	`margin_pct` decimal(6,2),
	`tier` enum('basic','medium','premium','industrial'),
	`active` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`contact_id` varchar(36),
	`lead_id` varchar(36),
	`inspection_id` varchar(36),
	`number` varchar(40),
	`line_items` json,
	`subtotal` decimal(12,2),
	`gst` decimal(12,2),
	`total` decimal(12,2),
	`status` enum('draft','sent','accepted','rejected','expired') NOT NULL DEFAULT 'draft',
	`valid_until` timestamp,
	`pdf_url` varchar(512),
	`price_snapshot` json,
	`price_list_version` varchar(64),
	`formula_version` varchar(64),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` varchar(191) NOT NULL,
	`device_id` varchar(64),
	`expires_at` timestamp NOT NULL,
	`revoked` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `spam_signals` (
	`id` varchar(36) NOT NULL,
	`kind` enum('irrelevant_image','duplicate_image','rate','bot','voip','abuse') NOT NULL,
	`ip` varchar(64),
	`device_id` varchar(64),
	`phone_hash` varchar(64),
	`detail` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `spam_signals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` varchar(36) NOT NULL,
	`name` varchar(191) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`branding` json,
	`pricing_config` json,
	`status` enum('active','suspended') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_slug_ux` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `tool_configs` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`tool_key` varchar(80) NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`gate` enum('public','otp','account') NOT NULL DEFAULT 'public',
	`access` enum('self_serve','site_visit_only') NOT NULL DEFAULT 'self_serve',
	`params` json,
	`blank_template` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tool_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `tool_configs_ux` UNIQUE(`tenant_id`,`tool_key`)
);
--> statement-breakpoint
CREATE TABLE `trusted_devices` (
	`id` varchar(36) NOT NULL,
	`contact_id` varchar(36) NOT NULL,
	`device_id` varchar(64) NOT NULL,
	`last_otp_at` timestamp,
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trusted_devices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(191),
	`phone` varchar(20),
	`password_hash` varchar(191),
	`name` varchar(191),
	`contact_id` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_ux` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `warranties` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`job_id` varchar(36),
	`contact_id` varchar(36),
	`card_no` varchar(40) NOT NULL,
	`qr_token` varchar(64) NOT NULL,
	`brand` varchar(120),
	`years` int,
	`issue_date` timestamp NOT NULL DEFAULT (now()),
	`expiry_date` timestamp,
	`snapshot` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `warranties_id` PRIMARY KEY(`id`),
	CONSTRAINT `warranties_card_ux` UNIQUE(`card_no`),
	CONSTRAINT `warranties_qr_ux` UNIQUE(`qr_token`)
);
--> statement-breakpoint
CREATE INDEX `appointments_tenant_ix` ON `appointments` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `audit_log_tenant_ix` ON `audit_log` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `bans_ip_ix` ON `bans` (`ip`);--> statement-breakpoint
CREATE INDEX `brand_specs_tenant_ix` ON `brand_specs` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `client_events_contact_ix` ON `client_events` (`contact_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `client_events_session_ix` ON `client_events` (`session_id`);--> statement-breakpoint
CREATE INDEX `contacts_tenant_ix` ON `contacts` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `contacts_phone_ix` ON `contacts` (`tenant_id`,`phone_hash`);--> statement-breakpoint
CREATE INDEX `estimates_tenant_ix` ON `estimates` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `execution_items_job_ix` ON `execution_items` (`job_id`);--> statement-breakpoint
CREATE INDEX `formula_sets_tenant_ix` ON `formula_sets` (`tenant_id`,`active`);--> statement-breakpoint
CREATE INDEX `inspection_photos_ix` ON `inspection_photos` (`inspection_id`);--> statement-breakpoint
CREATE INDEX `inspections_tenant_ix` ON `inspections` (`tenant_id`,`status`);--> statement-breakpoint
CREATE INDEX `jobs_tenant_ix` ON `jobs` (`tenant_id`,`status`);--> statement-breakpoint
CREATE INDEX `leads_tenant_ix` ON `leads` (`tenant_id`,`status`);--> statement-breakpoint
CREATE INDEX `leads_score_ix` ON `leads` (`tenant_id`,`score`);--> statement-breakpoint
CREATE INDEX `master_reports_tenant_ix` ON `master_reports` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `master_reports_contact_ix` ON `master_reports` (`contact_id`);--> statement-breakpoint
CREATE INDEX `memberships_tenant_ix` ON `memberships` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `otp_log_phone_ix` ON `otp_log` (`phone_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `otp_log_ip_ix` ON `otp_log` (`ip`,`created_at`);--> statement-breakpoint
CREATE INDEX `photo_analyses_tenant_ix` ON `photo_analyses` (`tenant_id`);--> statement-breakpoint
CREATE INDEX `photo_analyses_phash_ix` ON `photo_analyses` (`phash`);--> statement-breakpoint
CREATE INDEX `price_lists_tenant_ix` ON `price_lists` (`tenant_id`,`active`);--> statement-breakpoint
CREATE INDEX `products_tenant_ix` ON `products` (`tenant_id`,`active`);--> statement-breakpoint
CREATE INDEX `quotes_tenant_ix` ON `quotes` (`tenant_id`,`status`);--> statement-breakpoint
CREATE INDEX `refresh_tokens_ix` ON `refresh_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `spam_signals_ip_ix` ON `spam_signals` (`ip`,`created_at`);--> statement-breakpoint
CREATE INDEX `trusted_devices_ix` ON `trusted_devices` (`contact_id`,`device_id`);--> statement-breakpoint
CREATE INDEX `users_phone_ix` ON `users` (`phone`);