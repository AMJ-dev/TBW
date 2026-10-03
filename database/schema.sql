SET FOREIGN_KEY_CHECKS=0;SET UNIQUE_CHECKS=0;

CREATE DATABASE IF NOT EXISTS `trinu1` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `trinu1`;


DROP TABLE IF EXISTS `account_events`;

CREATE TABLE `account_events` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `event` enum('signin','signout','mfa_enabled','mfa_disabled','mfa_verified','mfa_failed','password_changed','password_reset_requested','password_reset_completed','email_verified','phone_verified','device_trusted','device_revoked','session_revoked','account_locked','account_unlocked') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `device_name` varchar(128) DEFAULT NULL,
  `detail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`detail`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_account_event_user` (`user_id`),
  KEY `idx_account_event_type` (`event`),
  KEY `idx_account_event_time` (`created_at`),
  CONSTRAINT `fk_account_event_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `account_events` WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS `login_attempts`;
CREATE TABLE `login_attempts` (
  `id` char(36) NOT NULL,
  `email` varchar(254) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `outcome` enum('success','invalid_password','invalid_email','locked','mfa_pending','mfa_failed') NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_login_email_time` (`email`,`created_at`),
  KEY `idx_login_ip_time` (`ip_address`,`created_at`),
  KEY `idx_login_user` (`user_id`),
  KEY `idx_login_outcome` (`outcome`),
  CONSTRAINT `fk_login_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `login_attempts` WRITE;
INSERT INTO `login_attempts` VALUES ('c9ffd8e1-b7d0-48','hqfdevelopers@gmail.com','682f7cf2-b05f-4c','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','success','Password and MFA verified','2026-09-29 17:35:32');
UNLOCK TABLES;


DROP TABLE IF EXISTS `organisation_members`;

CREATE TABLE `organisation_members` (
  `id` char(36) NOT NULL,
  `organisation_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `role_id` char(36) NOT NULL,
  `job_title` varchar(150) DEFAULT NULL,
  `membership_status` enum('pending','active','revoked') NOT NULL DEFAULT 'pending',
  `invited_by` char(36) DEFAULT NULL,
  `joined_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_org_member` (`organisation_id`,`user_id`),
  KEY `idx_member_user` (`user_id`),
  KEY `idx_member_status` (`membership_status`),
  KEY `idx_member_invited_by` (`invited_by`),
  KEY `idx_member_role` (`role_id`),
  CONSTRAINT `fk_member_invited_by` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_member_organisation` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`),
  CONSTRAINT `fk_member_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `fk_member_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `organisation_members` WRITE;
UNLOCK TABLES;


DROP TABLE IF EXISTS `organisations`;
CREATE TABLE `organisations` (
  `id` char(36) NOT NULL,
  `organisation_name` varchar(255) NOT NULL,
  `rc_number` varchar(100) DEFAULT NULL,
  `tin` varchar(100) DEFAULT NULL,
  `organisation_type` enum('terminal','importer','agent') NOT NULL,
  `verification_status` enum('pending','under_review','verified','rejected','suspended') NOT NULL DEFAULT 'pending',
  `verified_by` char(36) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_org_rc` (`rc_number`),
  UNIQUE KEY `uq_org_tin` (`tin`),
  KEY `idx_org_status` (`verification_status`),
  KEY `idx_org_name` (`organisation_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `organisations` WRITE;
INSERT INTO `organisations` VALUES ('d2beefba-e4bc-4d','TRINU BONDED WAREHOUSE','RC-2555656565','61561651615','terminal','verified',NULL,NULL,NULL,'2026-09-29 13:56:20','2026-09-29 19:00:42');
UNLOCK TABLES;

DROP TABLE IF EXISTS `otp_codes`;
;
CREATE TABLE `otp_codes` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `channel` enum('email','sms','whatsapp') NOT NULL DEFAULT 'email',
  `destination` varchar(254) NOT NULL,
  `purpose` enum('login_mfa','password_reset','phone_verify','regulator_access') NOT NULL,
  `attempts` tinyint(3) NOT NULL DEFAULT 0,
  `max_attempts` tinyint(3) NOT NULL DEFAULT 5,
  `resend_count` smallint(5) NOT NULL DEFAULT 0,
  `last_sent_at` datetime DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `verified_at` datetime DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_otp_user` (`user_id`),
  KEY `idx_otp_destination` (`destination`),
  KEY `idx_otp_purpose` (`purpose`),
  KEY `idx_otp_expiry` (`expires_at`),
  CONSTRAINT `fk_otp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `otp_codes` WRITE;
INSERT INTO `otp_codes` VALUES ('4b1243da-ba18-4b','682f7cf2-b05f-4c','$2y$10$/F8waWdFIZkDaySUprDLaeRxw7gyMPArx1pIStGc3sjQzBPImIeSi','email','hqfdevelopers@gmail.com','login_mfa',0,5,1,'2026-09-29 18:35:10','2026-09-29 18:40:10','2026-09-29 18:35:32',NULL,'::1','2026-09-29 17:35:10');
UNLOCK TABLES;

DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE `password_resets` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `email` varchar(254) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_password_reset_token` (`token_hash`),
  KEY `idx_password_reset_user` (`user_id`),
  KEY `idx_password_reset_email` (`email`),
  KEY `idx_password_reset_expiry` (`expires_at`),
  CONSTRAINT `fk_password_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `password_resets` WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS `permissions`;
CREATE TABLE `permissions` (
  `id` char(36) NOT NULL,
  `permission_key` varchar(120) NOT NULL,
  `module` varchar(80) NOT NULL,
  `action` varchar(80) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_permission_key` (`permission_key`),
  KEY `idx_permission_module` (`module`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `permissions` WRITE;
INSERT INTO `permissions` VALUES ('1838d8fb-bc37-11f1-bb55-5081407ad051','portal.view','portal','view','Access the stakeholder portal.','2026-09-29 18:53:45'),('1838defc-bc37-11f1-bb55-5081407ad051','portal.cargo','portal','cargo','View authorised cargo information.','2026-09-29 18:53:45'),('1838df69-bc37-11f1-bb55-5081407ad051','portal.documents','portal','documents','Access authorised documents.','2026-09-29 18:53:45'),('1838dfa3-bc37-11f1-bb55-5081407ad051','portal.financials','portal','financials','View authorised financial information.','2026-09-29 18:53:45'),('1838dfdd-bc37-11f1-bb55-5081407ad051','portal.requests','portal','requests','Create and manage authorised service requests.','2026-09-29 18:53:45'),('1838e013-bc37-11f1-bb55-5081407ad051','operations.view','operations','view','View terminal operations.','2026-09-29 18:53:45'),('1838e040-bc37-11f1-bb55-5081407ad051','operations.manage','operations','manage','Manage terminal operational workflows.','2026-09-29 18:53:45'),('1838e071-bc37-11f1-bb55-5081407ad051','operations.cargo','operations','cargo','Manage cargo receiving, movements and status workflows.','2026-09-29 18:53:45'),('1838e0a9-bc37-11f1-bb55-5081407ad051','operations.holds','operations','holds','Manage authorised holds and hold-related workflows.','2026-09-29 18:53:45'),('1838e0dd-bc37-11f1-bb55-5081407ad051','operations.examination','operations','examination','Manage examination scheduling and evidence capture without making Customs decisions.','2026-09-29 18:53:45'),('1838e115-bc37-11f1-bb55-5081407ad051','gate.view','gate','view','View gate operations and bookings.','2026-09-29 18:53:45'),('1838e144-bc37-11f1-bb55-5081407ad051','gate.bookings','gate','bookings','Manage vehicle and gate bookings.','2026-09-29 18:53:45'),('1838e174-bc37-11f1-bb55-5081407ad051','gate.admit','gate','admit','Perform authorised gate admission decisions.','2026-09-29 18:53:45'),('1838e1a4-bc37-11f1-bb55-5081407ad051','gate.refer','gate','refer','Refer gate movements with reasons.','2026-09-29 18:53:45'),('1838e1d8-bc37-11f1-bb55-5081407ad051','gate.reject','gate','reject','Reject gate movements with reasons.','2026-09-29 18:53:45'),('1838e20a-bc37-11f1-bb55-5081407ad051','gate.override','gate','override','Perform supervisor-authorised gate overrides.','2026-09-29 18:53:45'),('1838e23e-bc37-11f1-bb55-5081407ad051','gate.gate_out','gate','gate_out','Perform gate-out and release checks within assigned authority.','2026-09-29 18:53:45'),('1838e270-bc37-11f1-bb55-5081407ad051','warehouse.view','warehouse','view','View warehouse and yard information.','2026-09-29 18:53:45'),('1838e2a1-bc37-11f1-bb55-5081407ad051','warehouse.receive','warehouse','receive','Receive and tally cargo.','2026-09-29 18:53:45'),('1838e2d6-bc37-11f1-bb55-5081407ad051','warehouse.inventory','warehouse','inventory','Manage inventory counts and approved adjustments.','2026-09-29 18:53:45'),('1838e30e-bc37-11f1-bb55-5081407ad051','warehouse.position','warehouse','position','Position and relocate cargo.','2026-09-29 18:53:45'),('1838e347-bc37-11f1-bb55-5081407ad051','warehouse.pick','warehouse','pick','Pick cargo for authorised workflows.','2026-09-29 18:53:45'),('1838e37c-bc37-11f1-bb55-5081407ad051','documents.view','documents','view','View authorised documents.','2026-09-29 18:53:45'),('1838e3af-bc37-11f1-bb55-5081407ad051','documents.manage','documents','manage','Register and manage documents.','2026-09-29 18:53:45'),('1838e3e0-bc37-11f1-bb55-5081407ad051','documents.verify','documents','verify','Verify documents.','2026-09-29 18:53:45'),('1838e414-bc37-11f1-bb55-5081407ad051','documents.issue','documents','issue','Issue authorised terminal documents.','2026-09-29 18:53:45'),('1838e445-bc37-11f1-bb55-5081407ad051','finance.view','finance','view','View financial information.','2026-09-29 18:53:45'),('1838e477-bc37-11f1-bb55-5081407ad051','finance.tariffs','finance','tariffs','Manage tariffs and charging rules within authority.','2026-09-29 18:53:45'),('1838e4a9-bc37-11f1-bb55-5081407ad051','finance.invoices','finance','invoices','Manage invoices, credit notes and receipts within authority.','2026-09-29 18:53:45'),('1838e4db-bc37-11f1-bb55-5081407ad051','finance.payments','finance','payments','Manage payment records and payment confirmation workflows.','2026-09-29 18:53:45'),('1838e50a-bc37-11f1-bb55-5081407ad051','finance.reconciliation','finance','reconciliation','Perform payment and bank reconciliation.','2026-09-29 18:53:45'),('1838e53a-bc37-11f1-bb55-5081407ad051','finance.collections','finance','collections','Manage collections, ageing and dunning workflows.','2026-09-29 18:53:45'),('1838e56b-bc37-11f1-bb55-5081407ad051','finance.adjustments','finance','adjustments','Manage authorised financial adjustments, discounts and waivers.','2026-09-29 18:53:45'),('1838e59a-bc37-11f1-bb55-5081407ad051','reports.view','reports','view','View role-scoped reports.','2026-09-29 18:53:45'),('1838e5c9-bc37-11f1-bb55-5081407ad051','reports.export','reports','export','Export role-scoped reports.','2026-09-29 18:53:45'),('1838e5fa-bc37-11f1-bb55-5081407ad051','reports.management','reports','management','Access management reporting and analytics.','2026-09-29 18:53:45'),('1838e62d-bc37-11f1-bb55-5081407ad051','customer_service.view','customer_service','view','View customer service and sales records.','2026-09-29 18:53:45'),('1838e65c-bc37-11f1-bb55-5081407ad051','customer_service.manage','customer_service','manage','Manage customer service workflows.','2026-09-29 18:53:45'),('1838e68d-bc37-11f1-bb55-5081407ad051','customer_service.quotes','customer_service','quotes','Manage enquiries and quotations.','2026-09-29 18:53:45'),('1838e6c1-bc37-11f1-bb55-5081407ad051','customer_service.onboarding','customer_service','onboarding','Manage KYC and onboarding workflows.','2026-09-29 18:53:45'),('1838e6fa-bc37-11f1-bb55-5081407ad051','compliance.view','compliance','view','View compliance and Customs liaison records.','2026-09-29 18:53:45'),('1838e72a-bc37-11f1-bb55-5081407ad051','compliance.manage','compliance','manage','Manage compliance workflows and authorised Customs references.','2026-09-29 18:53:45'),('1838e75b-bc37-11f1-bb55-5081407ad051','compliance.audit','compliance','audit','Prepare authorised audit and compliance responses.','2026-09-29 18:53:45'),('1838e78b-bc37-11f1-bb55-5081407ad051','management.dashboard','management','dashboard','Access management dashboards.','2026-09-29 18:53:45'),('1838e7d5-bc37-11f1-bb55-5081407ad051','management.reports','management','reports','Access management reports and analytics.','2026-09-29 18:53:45'),('1838e809-bc37-11f1-bb55-5081407ad051','administration.users','administration','users','Manage users and memberships.','2026-09-29 18:53:45'),('1838e83b-bc37-11f1-bb55-5081407ad051','administration.roles','administration','roles','Manage roles.','2026-09-29 18:53:45'),('1838e86a-bc37-11f1-bb55-5081407ad051','administration.permissions','administration','permissions','Manage permissions and role assignments.','2026-09-29 18:53:45'),('1838e89f-bc37-11f1-bb55-5081407ad051','administration.configuration','administration','configuration','Manage designated business configuration.','2026-09-29 18:53:45'),('1838e8d6-bc37-11f1-bb55-5081407ad051','administration.audit','administration','audit','View and export audit records.','2026-09-29 18:53:45'),('1838e909-bc37-11f1-bb55-5081407ad051','administration.feature_flags','administration','feature_flags','Manage feature flags and maintenance controls.','2026-09-29 18:53:45'),('1838e93f-bc37-11f1-bb55-5081407ad051','administration.integrations','administration','integrations','Manage integration configuration and operational controls.','2026-09-29 18:53:45'),('1838e977-bc37-11f1-bb55-5081407ad051','system.organisations','system','organisations','Manage and view all organisations.','2026-09-29 18:53:45'),('1838e9a8-bc37-11f1-bb55-5081407ad051','system.users','system','users','Manage users across the platform.','2026-09-29 18:53:45'),('1838e9dc-bc37-11f1-bb55-5081407ad051','system.roles','system','roles','Manage platform roles and permissions.','2026-09-29 18:53:45'),('1838ea93-bc37-11f1-bb55-5081407ad051','system.audit','system','audit','View platform-wide audit information.','2026-09-29 18:53:45'),('1838ead1-bc37-11f1-bb55-5081407ad051','system.configuration','system','configuration','Manage platform-wide configuration.','2026-09-29 18:53:45');
UNLOCK TABLES;

DROP TABLE IF EXISTS `registration_otps`;
CREATE TABLE `registration_otps` (
  `id` char(36) NOT NULL,
  `registration_request_id` char(36) NOT NULL,
  `channel` enum('email','sms') NOT NULL,
  `destination` varchar(254) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `purpose` enum('registration_email','registration_phone') NOT NULL,
  `attempts` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `max_attempts` tinyint(3) unsigned NOT NULL DEFAULT 5,
  `resend_count` smallint(5) unsigned NOT NULL DEFAULT 0,
  `last_sent_at` datetime DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `verified_at` datetime DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_otp_request` (`registration_request_id`),
  KEY `idx_otp_destination` (`destination`),
  KEY `idx_otp_expiry` (`expires_at`),
  KEY `idx_otp_verified` (`verified_at`),
  CONSTRAINT `fk_registration_otp_request` FOREIGN KEY (`registration_request_id`) REFERENCES `registration_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `registration_otps` WRITE;
INSERT INTO `registration_otps` VALUES ('bcbb8403-b1d0-47','a5abe645-d228-4f','email','hqfdevelopers@gmail.com','$2y$10$SEfXGJLeG/4rmVCL2kBv8.Rhuo38/HpS/5rITnXfFcB6wqDrcr.kK','registration_email',0,5,0,'2026-09-29 14:55:35','2026-09-29 15:00:35','2026-09-29 14:56:17',NULL,'2026-09-29 13:55:35');

UNLOCK TABLES;


DROP TABLE IF EXISTS `registration_requests`;
CREATE TABLE `registration_requests` (
  `id` char(36) NOT NULL,
  `registration_ref` char(36) NOT NULL,
  `account_type` enum('importer','agent') NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `phone` varchar(25) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `organisation_name` varchar(255) NOT NULL,
  `rc_number` varchar(100) DEFAULT NULL,
  `tin` varchar(100) DEFAULT NULL,
  `job_title` varchar(150) DEFAULT NULL,
  `status` enum('pending_otp','verified','completed','expired','cancelled','locked') NOT NULL DEFAULT 'pending_otp',
  `email_verified_at` datetime DEFAULT NULL,
  `phone_verified_at` datetime DEFAULT NULL,
  `terms_accepted` tinyint(1) NOT NULL DEFAULT 0,
  `privacy_accepted` tinyint(1) NOT NULL DEFAULT 0,
  `terms_version` varchar(30) DEFAULT NULL,
  `privacy_version` varchar(30) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `completed_user_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_registration_ref` (`registration_ref`),
  KEY `idx_registration_email` (`email`),
  KEY `idx_registration_phone` (`phone`),
  KEY `idx_registration_status` (`status`),
  KEY `idx_registration_expiry` (`expires_at`),
  CONSTRAINT `chk_registration_terms` CHECK (`terms_accepted` = 1 and `privacy_accepted` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `registration_requests` WRITE;
INSERT INTO `registration_requests` VALUES ('a5abe645-d228-4f','49f75b78-b5c9-4d9d-9d1a-ea3b8847dff1','importer','Mathias','hqfdevelopers@gmail.com','+2348164902529','$2y$10$T/EwX7MAZLm.S7MkDiYHveorvUIBR3m.zfrkuuKFn6kQ5PiGmgM62','Antlatic Electronics trades','RC-2555656565','61561651615','Manager','completed','2026-09-29 14:56:17',NULL,1,1,'1.0','1.0','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-29 15:25:35','682f7cf2-b05f-4c','2026-09-29 13:55:35','2026-09-29 13:56:20');

UNLOCK TABLES;


DROP TABLE IF EXISTS `role_permissions`;
CREATE TABLE `role_permissions` (
  `role_id` char(36) NOT NULL,
  `permission_id` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `idx_role_permission_permission` (`permission_id`),
  CONSTRAINT `fk_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `role_permissions` WRITE;
INSERT INTO `role_permissions` VALUES ('18386d94-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e5fa-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e62d-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e65c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e68d-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e6c1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e6fa-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e72a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e75b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e78b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e7d5-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e809-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e83b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e86a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e89f-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e8d6-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e909-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e93f-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e977-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e9a8-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e9dc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838ea93-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838ead1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e5fa-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e62d-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e65c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e68d-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e6c1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e6fa-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e72a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e75b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e78b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e7d5-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e809-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e83b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e86a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e89f-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e8d6-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e909-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e93f-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e5fa-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e78b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e7d5-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e62d-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e65c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e68d-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e6c1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e6fa-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e72a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e75b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45');
UNLOCK TABLES;

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` char(36) NOT NULL,
  `role_key` varchar(80) NOT NULL,
  `role_name` varchar(120) NOT NULL,
  `scope` enum('system','organisation') NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_role_key` (`role_key`),
  KEY `idx_role_scope` (`scope`),
  KEY `idx_role_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `roles` WRITE;
INSERT INTO `roles` VALUES ('18386d94-bc37-11f1-bb55-5081407ad051','system_admin','System Administrator','system','Platform-wide administration across all organisations.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','organisation_owner','Organisation Owner','organisation','Full access to the organisation and its operational functions.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','management','Management','organisation','Management dashboards, reports and authorised operational and financial visibility.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','finance','Finance','organisation','Tariffs, invoices, payments, collections and reconciliation.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','terminal_operations','Terminal Operations','organisation','Cargo receiving, movements, holds, exceptions and operational workflows.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','gate_officer','Gate Officer','organisation','Gate bookings, gate decisions, gate-in and gate-out operations.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','warehouse_yard_officer','Warehouse / Yard Officer','organisation','Warehouse, yard, inventory, positioning, picking and relocation operations.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','documentation_officer','Documentation Officer','organisation','Document registration, verification and issuance.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','customer_service_sales','Customer Service / Sales','organisation','Enquiries, quotations, onboarding and customer service workflows.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','compliance_customs_liaison','Compliance / Customs Liaison','organisation','Compliance workflows, Customs liaison and audit response.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','regulator_auditor','Regulator / Auditor','organisation','Scoped read-only access to authorised records.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','portal_user','Portal User','organisation','Basic authorised stakeholder portal access.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45');

UNLOCK TABLES;

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `session_token_hash` varchar(255) NOT NULL,
  `refresh_token_hash` varchar(255) DEFAULT NULL,
  `device_name` varchar(128) DEFAULT NULL,
  `device_kind` enum('laptop','phone','tablet','unknown') NOT NULL DEFAULT 'unknown',
  `os` varchar(128) DEFAULT NULL,
  `browser` varchar(128) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `location` varchar(128) DEFAULT NULL,
  `is_trusted` tinyint(1) NOT NULL DEFAULT 0,
  `mfa_verified` tinyint(1) NOT NULL DEFAULT 0,
  `last_active_at` datetime NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `revoked_reason` varchar(128) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_session_token` (`session_token_hash`),
  KEY `idx_session_user` (`user_id`),
  KEY `idx_session_active` (`user_id`,`revoked_at`,`expires_at`),
  KEY `idx_session_expiry` (`expires_at`),
  KEY `idx_session_trusted` (`user_id`,`is_trusted`,`revoked_at`),
  CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `sessions` WRITE;
INSERT INTO `sessions` VALUES ('efbc35a2-dd8f-43','682f7cf2-b05f-4c','568d88207f1afe7b1d9d88cf24c4a8ea88e3feb3e9dd1a661c1d6e31e0761dd4',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-09-29 18:35:32','2026-10-29 18:35:32',NULL,NULL,'2026-09-29 17:35:32');

UNLOCK TABLES;

DROP TABLE IF EXISTS `trusted_devices`;
CREATE TABLE `trusted_devices` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `device_fingerprint` varchar(255) NOT NULL,
  `device_name` varchar(128) DEFAULT NULL,
  `trusted_until` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `last_used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_trusted_device` (`user_id`,`device_fingerprint`),
  KEY `idx_trusted_user` (`user_id`),
  KEY `idx_trusted_expiry` (`trusted_until`),
  CONSTRAINT `fk_trusted_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `trusted_devices` WRITE;
UNLOCK TABLES;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `organisation_id` char(36) DEFAULT NULL,
  `account_type` enum('system','organisation') NOT NULL DEFAULT 'organisation',
  `system_role_id` char(36) DEFAULT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `phone` varchar(25) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `phone_verified_at` datetime DEFAULT NULL,
  `account_status` enum('pending_approval','active','rejected','suspended','locked') NOT NULL DEFAULT 'pending_approval',
  `failed_login_attempts` smallint(5) unsigned NOT NULL DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  `last_login_at` datetime DEFAULT NULL,
  `password_changed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_email` (`email`),
  UNIQUE KEY `uq_user_phone` (`phone`),
  KEY `idx_user_organisation` (`organisation_id`),
  KEY `idx_user_status` (`account_status`),
  KEY `idx_user_account_type` (`account_type`),
  KEY `idx_user_system_role` (`system_role_id`),
  CONSTRAINT `fk_user_organisation` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`),
  CONSTRAINT `fk_user_system_role` FOREIGN KEY (`system_role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


LOCK TABLES `users` WRITE;
INSERT INTO `users` VALUES ('682f7cf2-b05f-4c',NULL,'system','18386d94-bc37-11f1-bb55-5081407ad051','Mathias','hqfdevelopers@gmail.com','+2348164902529','$2y$10$T/EwX7MAZLm.S7MkDiYHveorvUIBR3m.zfrkuuKFn6kQ5PiGmgM62','2026-09-29 14:56:17',NULL,'active',0,NULL,'2026-09-29 18:35:32','2026-09-29 14:56:20','2026-09-29 13:56:20','2026-09-29 18:53:45');

UNLOCK TABLES;

LOCK TABLES `organisations` WRITE;
INSERT INTO `organisations` (`id`,`organisation_name`,`rc_number`,`tin`,`organisation_type`,`verification_status`,`verified_at`,`created_at`,`updated_at`) VALUES 
('org-atl-001','Atlantic Trade Nigeria Ltd','RC-1049281','20491820192','importer','verified','2026-09-10 10:00:00','2026-09-01 08:30:00','2026-09-10 10:00:00'),
('org-kad-002','Kaduna Import & Distribution Ltd','RC-2948102','39481920194','importer','verified','2026-09-12 11:30:00','2026-09-02 09:15:00','2026-09-12 11:30:00'),
('org-wes-003','Westbridge Logistics','RC-3819204','48192019481','agent','verified','2026-09-05 14:00:00','2026-09-03 10:00:00','2026-09-05 14:00:00'),
('org-coa-004','Coastal Freight Nigeria','RC-4728192','57281920491','agent','verified','2026-09-08 16:20:00','2026-09-04 11:45:00','2026-09-08 16:20:00'),
('org-prm-005','Prime Haulage Ltd','RC-5619283','68291049182','haulier','verified','2026-09-02 09:00:00','2026-09-01 08:00:00','2026-09-02 09:00:00')
ON DUPLICATE KEY UPDATE `organisation_name`=VALUES(`organisation_name`);
UNLOCK TABLES;

LOCK TABLES `users` WRITE;
INSERT INTO `users` (`id`,`organisation_id`,`account_type`,`full_name`,`email`,`phone`,`password_hash`,`email_verified_at`,`phone_verified_at`,`account_status`,`created_at`,`updated_at`) VALUES 
('usr-ade-002','org-atl-001','organisation','M. Adeyemi','adeyemi@atlantictradenig.com','+2348031112233','$2y$10$T/EwX7MAZLm.S7MkDiYHveorvUIBR3m.zfrkuuKFn6kQ5PiGmgM62','2026-09-02 10:00:00','2026-09-02 10:05:00','active','2026-09-01 09:00:00','2026-09-28 09:00:00'),
('usr-mus-003','d2beefba-e4bc-4d','organisation','I. Musa (Gate Officer)','musa.gate@trinuterminal.com','+2348052223344','$2y$10$T/EwX7MAZLm.S7MkDiYHveorvUIBR3m.zfrkuuKFn6kQ5PiGmgM62','2026-09-01 08:00:00','2026-09-01 08:00:00','active','2026-09-01 08:00:00','2026-09-29 07:30:00'),
('usr-oka-004','d2beefba-e4bc-4d','organisation','D. Okafor (Yard Officer)','okafor.yard@trinuterminal.com','+2348073334455','$2y$10$T/EwX7MAZLm.S7MkDiYHveorvUIBR3m.zfrkuuKFn6kQ5PiGmgM62','2026-09-01 08:00:00','2026-09-01 08:00:00','active','2026-09-01 08:00:00','2026-09-29 07:45:00')
ON DUPLICATE KEY UPDATE `full_name`=VALUES(`full_name`);
UNLOCK TABLES;

LOCK TABLES `organisation_members` WRITE;
INSERT INTO `organisation_members` (`id`,`organisation_id`,`user_id`,`role_id`,`job_title`,`membership_status`,`joined_at`,`created_at`) VALUES 
('mem-ade-001','org-atl-001','usr-ade-002','183f5203-bc37-11f1-bb55-5081407ad051','Logistics Manager','active','2026-09-02 10:05:00','2026-09-02 10:00:00'),
('mem-mus-002','d2beefba-e4bc-4d','usr-mus-003','18387679-bc37-11f1-bb55-5081407ad051','Lead Gate Officer','active','2026-09-01 08:00:00','2026-09-01 08:00:00'),
('mem-oka-003','d2beefba-e4bc-4d','usr-oka-004','183876de-bc37-11f1-bb55-5081407ad051','Senior Yard Coordinator','active','2026-09-01 08:00:00','2026-09-01 08:00:00')
ON DUPLICATE KEY UPDATE `job_title`=VALUES(`job_title`);
UNLOCK TABLES;

DROP TABLE IF EXISTS `quote_line_items`;
DROP TABLE IF EXISTS `quote_requests`;
DROP TABLE IF EXISTS `delegations`;
DROP TABLE IF EXISTS `organisation_signatories`;
DROP TABLE IF EXISTS `organisation_kyc`;

CREATE TABLE `organisation_kyc` (
  `id` char(36) NOT NULL,
  `organisation_id` char(36) NOT NULL,
  `legal_name` varchar(255) NOT NULL,
  `trading_name` varchar(255) DEFAULT NULL,
  `rc_number` varchar(100) NOT NULL,
  `tin` varchar(100) NOT NULL,
  `incorporation_date` date DEFAULT NULL,
  `registered_address` text NOT NULL,
  `cac_certificate_url` varchar(500) DEFAULT NULL,
  `tin_certificate_url` varchar(500) DEFAULT NULL,
  `licence_reference` varchar(150) DEFAULT NULL,
  `licence_file_url` varchar(500) DEFAULT NULL,
  `directors_list_url` varchar(500) DEFAULT NULL,
  `utility_bill_url` varchar(500) DEFAULT NULL,
  `verification_checklist` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`verification_checklist`)),
  `status` enum('draft','submitted','under_review','verified','rejected') NOT NULL DEFAULT 'draft',
  `reviewed_by` char(36) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_org_kyc` (`organisation_id`),
  CONSTRAINT `fk_kyc_organisation` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_kyc_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `organisation_signatories` (
  `id` char(36) NOT NULL,
  `kyc_id` char(36) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `role_title` varchar(120) NOT NULL,
  `email` varchar(254) NOT NULL,
  `phone` varchar(25) NOT NULL,
  `id_type` enum('NIN','International Passport','Drivers Licence','Voters Card') NOT NULL,
  `id_number` varchar(100) NOT NULL,
  `id_document_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_signatory_kyc` (`kyc_id`),
  CONSTRAINT `fk_signatory_kyc` FOREIGN KEY (`kyc_id`) REFERENCES `organisation_kyc` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `delegations` (
  `id` char(36) NOT NULL,
  `grantor_organisation_id` char(36) NOT NULL,
  `grantee_name` varchar(150) NOT NULL,
  `grantee_email` varchar(254) NOT NULL,
  `grantee_organisation_name` varchar(255) DEFAULT NULL,
  `grantee_type` enum('Customs agent','Forwarder','Haulage','Other') NOT NULL,
  `scope_areas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`scope_areas`)),
  `consignment_reference` varchar(100) DEFAULT NULL,
  `bl_number` varchar(100) DEFAULT NULL,
  `container_number` varchar(50) DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `valid_from` datetime NOT NULL,
  `valid_until` datetime NOT NULL,
  `status` enum('active','revoked','expired') NOT NULL DEFAULT 'active',
  `revoked_by` char(36) DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `revocation_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_delegation_grantor` (`grantor_organisation_id`),
  KEY `idx_delegation_grantee_email` (`grantee_email`),
  KEY `idx_delegation_status` (`status`),
  CONSTRAINT `fk_delegation_grantor` FOREIGN KEY (`grantor_organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_delegation_revoker` FOREIGN KEY (`revoked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `quote_requests` (
  `id` char(36) NOT NULL,
  `quote_reference` varchar(50) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `contact_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `phone` varchar(25) NOT NULL,
  `cargo_type` varchar(100) NOT NULL,
  `cargo_description` text DEFAULT NULL,
  `container_count` int(10) unsigned NOT NULL DEFAULT 1,
  `container_size` enum('20FT','40FT','40HC','Special') NOT NULL DEFAULT '20FT',
  `estimated_weight_kg` decimal(12,2) DEFAULT NULL,
  `estimated_volume_cbm` decimal(10,2) DEFAULT NULL,
  `expected_arrival_date` date DEFAULT NULL,
  `storage_duration_days` int(10) unsigned NOT NULL DEFAULT 7,
  `required_services` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`required_services`)),
  `special_requirements` text DEFAULT NULL,
  `status` enum('new','assigned','quoted','won','lost','rejected') NOT NULL DEFAULT 'new',
  `assigned_to` char(36) DEFAULT NULL,
  `quoted_amount` decimal(15,2) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'NGN',
  `validity_date` date DEFAULT NULL,
  `quote_pdf_url` varchar(500) DEFAULT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `accepted_ip` varchar(45) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_quote_ref` (`quote_reference`),
  KEY `idx_quote_email` (`email`),
  KEY `idx_quote_status` (`status`),
  CONSTRAINT `fk_quote_assignee` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `quote_line_items` (
  `id` char(36) NOT NULL,
  `quote_request_id` char(36) NOT NULL,
  `service_code` varchar(50) NOT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 1.00,
  `unit` varchar(50) NOT NULL DEFAULT 'Container',
  `rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `idx_quote_line_quote` (`quote_request_id`),
  CONSTRAINT `fk_quote_line_request` FOREIGN KEY (`quote_request_id`) REFERENCES `quote_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `yard_movements`;
DROP TABLE IF EXISTS `warehouse_locations`;
DROP TABLE IF EXISTS `yard_slots`;
DROP TABLE IF EXISTS `terminal_locations`;

CREATE TABLE `terminal_locations` (
  `id` char(36) NOT NULL,
  `location_code` varchar(50) NOT NULL,
  `location_name` varchar(150) NOT NULL,
  `facility_type` enum('yard','warehouse','gate','examination_bay','weighbridge','quarantine','cold_storage','administration') NOT NULL,
  `is_bonded` tinyint(1) NOT NULL DEFAULT 1,
  `capacity_teu` int(10) unsigned DEFAULT 0,
  `capacity_cbm` decimal(12,2) DEFAULT 0.00,
  `current_occupancy_teu` int(10) unsigned DEFAULT 0,
  `security_level` enum('standard','high','restricted') NOT NULL DEFAULT 'standard',
  `coordinates_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`coordinates_json`)),
  `status` enum('active','maintenance','full','closed') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_location_code` (`location_code`),
  KEY `idx_location_type` (`facility_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `yard_slots` (
  `id` char(36) NOT NULL,
  `location_id` char(36) NOT NULL,
  `zone` varchar(20) NOT NULL,
  `block` varchar(20) NOT NULL,
  `row_code` varchar(20) NOT NULL,
  `slot_code` varchar(30) NOT NULL,
  `tier` tinyint(3) unsigned NOT NULL DEFAULT 1,
  `is_ground` tinyint(1) NOT NULL DEFAULT 1,
  `max_weight_tonnes` decimal(8,2) DEFAULT 35.00,
  `state` enum('Empty','Occupied','Reserved','Blocked','Under Examination') NOT NULL DEFAULT 'Empty',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_yard_slot` (`zone`,`block`,`row_code`,`slot_code`,`tier`),
  KEY `idx_yard_location` (`location_id`),
  KEY `idx_yard_state` (`state`),
  CONSTRAINT `fk_yard_location` FOREIGN KEY (`location_id`) REFERENCES `terminal_locations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `warehouse_locations` (
  `id` char(36) NOT NULL,
  `location_id` char(36) NOT NULL,
  `aisle` varchar(30) NOT NULL,
  `rack` varchar(30) NOT NULL,
  `shelf` varchar(30) NOT NULL,
  `bin_code` varchar(50) NOT NULL,
  `capacity_pallets` int(10) unsigned DEFAULT 1,
  `max_weight_kg` decimal(10,2) DEFAULT 1500.00,
  `is_bonded` tinyint(1) NOT NULL DEFAULT 1,
  `status` enum('available','occupied','reserved','quarantine') NOT NULL DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_warehouse_bin` (`bin_code`),
  KEY `idx_warehouse_location` (`location_id`),
  KEY `idx_warehouse_status` (`status`),
  CONSTRAINT `fk_wh_location` FOREIGN KEY (`location_id`) REFERENCES `terminal_locations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cargo_events`;
DROP TABLE IF EXISTS `cargo_tracking_subscriptions`;
DROP TABLE IF EXISTS `packages`;
DROP TABLE IF EXISTS `containers`;
DROP TABLE IF EXISTS `consignments`;
DROP TABLE IF EXISTS `manifests`;

CREATE TABLE `manifests` (
  `id` char(36) NOT NULL,
  `manifest_ref` varchar(100) NOT NULL,
  `bill_of_lading` varchar(100) NOT NULL,
  `vessel` varchar(150) NOT NULL,
  `voyage_number` varchar(50) DEFAULT NULL,
  `shipping_line` varchar(150) NOT NULL,
  `origin_port` varchar(100) NOT NULL,
  `discharge_port` varchar(100) NOT NULL DEFAULT 'Lagos / Apapa',
  `eta` datetime DEFAULT NULL,
  `discharge_date` date DEFAULT NULL,
  `total_containers` int(10) unsigned NOT NULL DEFAULT 1,
  `total_packages` int(10) unsigned NOT NULL DEFAULT 0,
  `gross_weight_kg` decimal(12,2) DEFAULT NULL,
  `manifest_status` enum('expected','arrived','discharged','reconciled','closed') NOT NULL DEFAULT 'expected',
  `uploaded_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_manifest_ref` (`manifest_ref`),
  KEY `idx_manifest_bl` (`bill_of_lading`),
  KEY `idx_manifest_line` (`shipping_line`),
  CONSTRAINT `fk_manifest_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `consignments` (
  `id` char(36) NOT NULL,
  `terminal_reference` varchar(50) NOT NULL,
  `manifest_id` char(36) DEFAULT NULL,
  `bill_of_lading` varchar(100) NOT NULL,
  `organisation_id` char(36) NOT NULL,
  `agent_organisation_id` char(36) DEFAULT NULL,
  `cargo_description` varchar(255) NOT NULL,
  `cargo_category` enum('general','containerised','agricultural','industrial','automotive','project','dangerous_goods','perishable') NOT NULL DEFAULT 'general',
  `shipping_line` varchar(150) NOT NULL,
  `vessel_name` varchar(150) DEFAULT NULL,
  `origin_port` varchar(100) DEFAULT NULL,
  `arrival_date` date NOT NULL,
  `free_days_allowed` int(10) unsigned NOT NULL DEFAULT 7,
  `storage_clock_start` datetime DEFAULT NULL,
  `storage_clock_end` datetime DEFAULT NULL,
  `status` enum(
    'EXPECTED',
    'IN_TRANSIT_TO_TERMINAL',
    'ARRIVED_AT_GATE',
    'RECEIVED',
    'STORED',
    'DOCS_IN_PROGRESS',
    'EXAMINATION_SCHEDULED',
    'UNDER_EXAMINATION',
    'EXAMINATION_COMPLETE',
    'HELD',
    'CHARGES_PENDING',
    'CHARGES_SETTLED',
    'RELEASE_AUTHORISED',
    'SLOT_BOOKED',
    'LOADING',
    'GATE_OUT',
    'CLOSED',
    'OVERSTAYED',
    'TRANSFERRED_OUT',
    'RETURNED_RE_EXPORTED'
  ) NOT NULL DEFAULT 'EXPECTED',
  `customer_label` varchar(100) NOT NULL DEFAULT 'Expected',
  `active_holds_count` smallint(5) unsigned NOT NULL DEFAULT 0,
  `total_weight_kg` decimal(12,2) DEFAULT NULL,
  `release_authorised_at` datetime DEFAULT NULL,
  `release_authorised_by` char(36) DEFAULT NULL,
  `release_authority_code` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_consignment_ref` (`terminal_reference`),
  KEY `idx_consignment_bl` (`bill_of_lading`),
  KEY `idx_consignment_org` (`organisation_id`),
  KEY `idx_consignment_agent` (`agent_organisation_id`),
  KEY `idx_consignment_status` (`status`),
  KEY `idx_consignment_arrival` (`arrival_date`),
  CONSTRAINT `fk_consignment_manifest` FOREIGN KEY (`manifest_id`) REFERENCES `manifests` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_consignment_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`),
  CONSTRAINT `fk_consignment_agent` FOREIGN KEY (`agent_organisation_id`) REFERENCES `organisations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_consignment_release_user` FOREIGN KEY (`release_authorised_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `containers` (
  `id` char(36) NOT NULL,
  `consignment_id` char(36) NOT NULL,
  `container_number` varchar(50) NOT NULL,
  `container_size` enum('20FT','40FT','40HC','45FT') NOT NULL DEFAULT '20FT',
  `container_type` enum('Dry','Reefer','Open Top','Flat Rack','Tank') NOT NULL DEFAULT 'Dry',
  `iso_code` varchar(20) DEFAULT NULL,
  `tare_weight_kg` decimal(10,2) DEFAULT NULL,
  `gross_weight_kg` decimal(10,2) NOT NULL,
  `manifest_seal_number` varchar(100) NOT NULL,
  `current_seal_number` varchar(100) NOT NULL,
  `seal_status` enum('intact','broken','mismatch','tampered','replaced') NOT NULL DEFAULT 'intact',
  `yard_slot_id` char(36) DEFAULT NULL,
  `location_display` varchar(100) NOT NULL DEFAULT 'Yard Intake',
  `dwell_days` int(10) unsigned NOT NULL DEFAULT 0,
  `status` enum(
    'EXPECTED',
    'IN_TRANSIT_TO_TERMINAL',
    'ARRIVED_AT_GATE',
    'RECEIVED',
    'STORED',
    'DOCS_IN_PROGRESS',
    'EXAMINATION_SCHEDULED',
    'UNDER_EXAMINATION',
    'EXAMINATION_COMPLETE',
    'HELD',
    'CHARGES_PENDING',
    'CHARGES_SETTLED',
    'RELEASE_AUTHORISED',
    'SLOT_BOOKED',
    'LOADING',
    'GATE_OUT',
    'CLOSED',
    'OVERSTAYED',
    'TRANSFERRED_OUT',
    'RETURNED_RE_EXPORTED'
  ) NOT NULL DEFAULT 'STORED',
  `customer_label` varchar(100) NOT NULL DEFAULT 'In storage',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_container_no` (`container_number`),
  KEY `idx_container_consignment` (`consignment_id`),
  KEY `idx_container_slot` (`yard_slot_id`),
  KEY `idx_container_status` (`status`),
  CONSTRAINT `fk_container_consignment` FOREIGN KEY (`consignment_id`) REFERENCES `consignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_container_slot` FOREIGN KEY (`yard_slot_id`) REFERENCES `yard_slots` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `packages` (
  `id` char(36) NOT NULL,
  `consignment_id` char(36) NOT NULL,
  `container_id` char(36) DEFAULT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `mark_number` varchar(100) NOT NULL,
  `package_kind` enum('Carton','Pallet','Crate','Bag','Drum','Loose') NOT NULL DEFAULT 'Carton',
  `description` varchar(255) NOT NULL,
  `system_qty` int(10) unsigned NOT NULL DEFAULT 1,
  `received_qty` int(10) unsigned NOT NULL DEFAULT 1,
  `damaged_qty` int(10) unsigned NOT NULL DEFAULT 0,
  `unit` varchar(50) NOT NULL DEFAULT 'Carton',
  `weight_kg` decimal(10,2) DEFAULT NULL,
  `dimensions_cbm` decimal(8,3) DEFAULT NULL,
  `warehouse_location_id` char(36) DEFAULT NULL,
  `location_display` varchar(100) DEFAULT NULL,
  `status` enum('expected','received','stored','picked','loaded','dispatched') NOT NULL DEFAULT 'stored',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_pkg_consignment` (`consignment_id`),
  KEY `idx_pkg_container` (`container_id`),
  KEY `idx_pkg_wh_location` (`warehouse_location_id`),
  CONSTRAINT `fk_pkg_consignment` FOREIGN KEY (`consignment_id`) REFERENCES `consignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pkg_container` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pkg_wh_location` FOREIGN KEY (`warehouse_location_id`) REFERENCES `warehouse_locations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cargo_events` (
  `id` char(36) NOT NULL,
  `consignment_id` char(36) NOT NULL,
  `container_id` char(36) DEFAULT NULL,
  `event_type` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `actor_name` varchar(150) NOT NULL,
  `actor_user_id` char(36) DEFAULT NULL,
  `location_name` varchar(150) NOT NULL,
  `device_id` varchar(100) DEFAULT NULL,
  `reference_code` varchar(100) DEFAULT NULL,
  `from_status` varchar(50) DEFAULT NULL,
  `to_status` varchar(50) DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `evidence_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`evidence_urls`)),
  `public_display` tinyint(1) NOT NULL DEFAULT 1,
  `event_time` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_cargo_event_consignment` (`consignment_id`),
  KEY `idx_cargo_event_container` (`container_id`),
  KEY `idx_cargo_event_time` (`event_time`),
  CONSTRAINT `fk_cargo_event_consignment` FOREIGN KEY (`consignment_id`) REFERENCES `consignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cargo_event_container` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cargo_event_user` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cargo_tracking_subscriptions` (
  `id` char(36) NOT NULL,
  `tracking_reference` varchar(100) NOT NULL,
  `channel` enum('email','sms','whatsapp') NOT NULL DEFAULT 'email',
  `recipient_contact` varchar(254) NOT NULL,
  `double_opt_in_verified` tinyint(1) NOT NULL DEFAULT 0,
  `verification_token` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_track_sub_ref` (`tracking_reference`),
  KEY `idx_track_sub_contact` (`recipient_contact`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `value_added_service_orders`;
DROP TABLE IF EXISTS `work_order_lines`;
DROP TABLE IF EXISTS `work_orders`;
DROP TABLE IF EXISTS `seal_verifications`;
DROP TABLE IF EXISTS `receiving_tallies`;
DROP TABLE IF EXISTS `inventory_adjustments`;
DROP TABLE IF EXISTS `cycle_count_items`;
DROP TABLE IF EXISTS `cycle_counts`;

CREATE TABLE `receiving_tallies` (
  `id` char(36) NOT NULL,
  `tally_reference` varchar(50) NOT NULL,
  `consignment_id` char(36) NOT NULL,
  `container_id` char(36) NOT NULL,
  `truck_no` varchar(50) NOT NULL,
  `driver_name` varchar(150) NOT NULL,
  `shipping_line` varchar(150) NOT NULL,
  `vessel_feed` varchar(150) DEFAULT NULL,
  `origin_port` varchar(100) DEFAULT NULL,
  `manifest_quantity` int(10) unsigned NOT NULL,
  `actual_quantity` int(10) unsigned NOT NULL,
  `variance_quantity` int(11) NOT NULL DEFAULT 0,
  `manifest_seal_no` varchar(100) NOT NULL,
  `received_seal_no` varchar(100) NOT NULL,
  `seal_condition` enum('intact','broken','mismatch','tampered') NOT NULL DEFAULT 'intact',
  `cargo_condition` enum('sound','damaged','wet','crushed','stained') NOT NULL DEFAULT 'sound',
  `bay_area` varchar(100) NOT NULL DEFAULT 'Receiving Bay 2',
  `tally_clerk_id` char(36) DEFAULT NULL,
  `clerk_name` varchar(150) NOT NULL,
  `photo_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`photo_urls`)),
  `received_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tally_ref` (`tally_reference`),
  KEY `idx_tally_consignment` (`consignment_id`),
  KEY `idx_tally_container` (`container_id`),
  CONSTRAINT `fk_tally_consignment` FOREIGN KEY (`consignment_id`) REFERENCES `consignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tally_container` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tally_clerk` FOREIGN KEY (`tally_clerk_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `seal_verifications` (
  `id` char(36) NOT NULL,
  `container_id` char(36) NOT NULL,
  `checkpoint` enum('gate_in','yard_intake','pre_examination','post_examination','stuffing','gate_out') NOT NULL,
  `manifest_seal` varchar(100) NOT NULL,
  `physical_seal` varchar(100) NOT NULL,
  `is_mismatch` tinyint(1) NOT NULL DEFAULT 0,
  `condition` enum('intact','broken','tampered','replaced') NOT NULL DEFAULT 'intact',
  `replacement_seal` varchar(100) DEFAULT NULL,
  `verified_by` char(36) DEFAULT NULL,
  `officer_name` varchar(150) NOT NULL,
  `supervisor_resolution` text DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `status` enum('verified','flagged','resolved') NOT NULL DEFAULT 'verified',
  `verified_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_seal_container` (`container_id`),
  CONSTRAINT `fk_seal_container` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_seal_verifier` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `work_orders` (
  `id` char(36) NOT NULL,
  `order_reference` varchar(50) NOT NULL,
  `order_kind` enum('Stuffing','De-stuffing','Cross-docking','Transshipment','Stripping') NOT NULL,
  `consignment_id` char(36) NOT NULL,
  `container_id` char(36) NOT NULL,
  `container_number` varchar(50) NOT NULL,
  `status` enum('draft','scheduled','in_progress','completed','inspected','cancelled') NOT NULL DEFAULT 'scheduled',
  `bay_location` varchar(100) NOT NULL DEFAULT 'Bay 1',
  `supervisor_id` char(36) DEFAULT NULL,
  `scheduled_date` datetime NOT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `manifest_qty` int(10) unsigned NOT NULL,
  `processed_qty` int(10) unsigned NOT NULL DEFAULT 0,
  `discrepancy_notes` text DEFAULT NULL,
  `signed_off_by` varchar(150) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_work_order_ref` (`order_reference`),
  KEY `idx_wo_consignment` (`consignment_id`),
  KEY `idx_wo_container` (`container_id`),
  CONSTRAINT `fk_wo_consignment` FOREIGN KEY (`consignment_id`) REFERENCES `consignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wo_container` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wo_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `work_order_lines` (
  `id` char(36) NOT NULL,
  `work_order_id` char(36) NOT NULL,
  `package_id` char(36) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `system_qty` int(10) unsigned NOT NULL,
  `loaded_qty` int(10) unsigned DEFAULT NULL,
  `unit` varchar(50) NOT NULL DEFAULT 'Carton',
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_wol_order` (`work_order_id`),
  CONSTRAINT `fk_wol_order` FOREIGN KEY (`work_order_id`) REFERENCES `work_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wol_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `value_added_service_orders` (
  `id` char(36) NOT NULL,
  `service_reference` varchar(50) NOT NULL,
  `service_kind` enum('Palletisation','Repackaging','Fumigation','Weighbridge Certified Weighing','Specialized Labelling','Sorting / Segregation','Sample Drawing','Shrink Wrapping') NOT NULL,
  `consignment_id` char(36) NOT NULL,
  `container_id` char(36) DEFAULT NULL,
  `organisation_id` char(36) NOT NULL,
  `status` enum('requested','approved','in_progress','completed','billed','cancelled') NOT NULL DEFAULT 'requested',
  `assigned_team` varchar(150) NOT NULL DEFAULT 'Operations Team 1',
  `scheduled_date` datetime NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `charge_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) NOT NULL DEFAULT 'NGN',
  `notes` text DEFAULT NULL,
  `completion_evidence_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`completion_evidence_urls`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vas_ref` (`service_reference`),
  KEY `idx_vas_consignment` (`consignment_id`),
  KEY `idx_vas_org` (`organisation_id`),
  CONSTRAINT `fk_vas_consignment` FOREIGN KEY (`consignment_id`) REFERENCES `consignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vas_container` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_vas_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cycle_counts` (
  `id` char(36) NOT NULL,
  `reference` varchar(50) NOT NULL,
  `scope` enum('Aisle A','Aisle B','Aisle C','Aisle D','Cold Bay','Heavy Bay','Full warehouse') NOT NULL,
  `scheduled_for` datetime NOT NULL,
  `assigned_to` varchar(150) NOT NULL,
  `assigned_user_id` char(36) DEFAULT NULL,
  `status` enum('Scheduled','In Progress','Completed','Approved','Discrepancy Flagged') NOT NULL DEFAULT 'Scheduled',
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cycle_count_ref` (`reference`),
  KEY `idx_cycle_status` (`status`),
  CONSTRAINT `fk_cycle_assigned` FOREIGN KEY (`assigned_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cycle_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cycle_count_items` (
  `id` char(36) NOT NULL,
  `cycle_count_id` char(36) NOT NULL,
  `package_id` char(36) DEFAULT NULL,
  `sku` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `location_bin` varchar(100) NOT NULL,
  `system_qty` int(10) unsigned NOT NULL,
  `counted_qty` int(10) unsigned DEFAULT NULL,
  `variance` int(11) DEFAULT 0,
  `unit` varchar(50) NOT NULL DEFAULT 'Carton',
  `condition` enum('Good','Damaged','Repackaged') NOT NULL DEFAULT 'Good',
  `variance_reason` varchar(255) DEFAULT NULL,
  `status` enum('pending','verified','adjusted') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `idx_cci_count` (`cycle_count_id`),
  CONSTRAINT `fk_cci_count` FOREIGN KEY (`cycle_count_id`) REFERENCES `cycle_counts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cci_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_adjustments` (
  `id` char(36) NOT NULL,
  `package_id` char(36) NOT NULL,
  `adjustment_type` enum('count_reconciliation','damage_write_off','found_stock','spillage_loss','reclassification') NOT NULL,
  `quantity_before` int(10) unsigned NOT NULL,
  `quantity_after` int(10) unsigned NOT NULL,
  `variance` int(11) NOT NULL,
  `unit` varchar(50) NOT NULL DEFAULT 'Carton',
  `reason` varchar(255) NOT NULL,
  `approved_by` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_adj_package` (`package_id`),
  CONSTRAINT `fk_adj_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_adj_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cargo_claims`;
DROP TABLE IF EXISTS `operational_overrides`;
DROP TABLE IF EXISTS `overstay_records`;
DROP TABLE IF EXISTS `cargo_holds`;
DROP TABLE IF EXISTS `cargo_examinations`;

CREATE TABLE `cargo_examinations` (
  `id` char(36) NOT NULL,
  `examination_reference` varchar(50) NOT NULL,
  `consignment_id` char(36) NOT NULL,
  `container_id` char(36) NOT NULL,
  `container_no` varchar(50) NOT NULL,
  `cargo_ref` varchar(50) NOT NULL,
  `consignee_name` varchar(255) NOT NULL,
  `customs_officer` varchar(150) NOT NULL,
  `customs_command` varchar(150) NOT NULL DEFAULT 'Zone A Command',
  `agency_representatives` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`agency_representatives`)),
  `bay_area` varchar(100) NOT NULL DEFAULT 'Examination Area 1',
  `examination_type` enum('joint_inspection','customs_physical','ndlea_agency','son_nafdac','terminal_internal') NOT NULL DEFAULT 'joint_inspection',
  `scheduled_date` datetime NOT NULL,
  `status` enum('Scheduled','In Progress','Completed','Adjourned','Sample Drawn','Query Raised') NOT NULL DEFAULT 'Scheduled',
  `outcome` enum('cleared','clean_report','query_raised','sample_drawn','detained','seizure_recommended') DEFAULT NULL,
  `outcome_notes` text DEFAULT NULL,
  `evidence_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`evidence_urls`)),
  `terminal_officer_id` char(36) DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_exam_ref` (`examination_reference`),
  KEY `idx_exam_consignment` (`consignment_id`),
  KEY `idx_exam_container` (`container_id`),
  CONSTRAINT `fk_exam_consignment` FOREIGN KEY (`consignment_id`) REFERENCES `consignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_exam_container` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_exam_terminal_officer` FOREIGN KEY (`terminal_officer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cargo_holds` (
  `id` char(36) NOT NULL,
  `hold_reference` varchar(50) NOT NULL,
  `consignment_id` char(36) NOT NULL,
  `container_id` char(36) DEFAULT NULL,
  `container_no` varchar(50) DEFAULT NULL,
  `cargo_ref` varchar(50) NOT NULL,
  `consignee_name` varchar(255) NOT NULL,
  `hold_type` enum('Customs Hold','Financial / Tariff Hold','Documentation Hold','Weight Discrepancy','Agency Hold (NDLEA/NAFDAC/SON)','Dispute Hold') NOT NULL,
  `authority_name` varchar(150) NOT NULL,
  `authority_reference` varchar(100) NOT NULL,
  `reason` text NOT NULL,
  `placed_by_name` varchar(150) NOT NULL,
  `placed_by_user_id` char(36) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `lifted_by_name` varchar(150) DEFAULT NULL,
  `lifted_by_user_id` char(36) DEFAULT NULL,
  `lifted_at` datetime DEFAULT NULL,
  `lifting_reason` text DEFAULT NULL,
  `lifting_authority_ref` varchar(100) DEFAULT NULL,
  `placed_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_hold_ref` (`hold_reference`),
  KEY `idx_hold_consignment` (`consignment_id`),
  KEY `idx_hold_container` (`container_id`),
  KEY `idx_hold_active` (`is_active`),
  CONSTRAINT `fk_hold_consignment` FOREIGN KEY (`consignment_id`) REFERENCES `consignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hold_container` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_hold_placed_by` FOREIGN KEY (`placed_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_hold_lifted_by` FOREIGN KEY (`lifted_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `overstay_records` (
  `id` char(36) NOT NULL,
  `consignment_id` char(36) NOT NULL,
  `container_id` char(36) NOT NULL,
  `arrival_date` date NOT NULL,
  `free_days_allowed` int(10) unsigned NOT NULL DEFAULT 7,
  `free_days_expired_date` date NOT NULL,
  `days_overstayed` int(10) unsigned NOT NULL,
  `escalation_tier` enum('tier_1_warning','tier_2_notice','tier_3_customs_liaison','tier_4_gazette_eligible','auction_nominated') NOT NULL DEFAULT 'tier_1_warning',
  `notices_sent_count` smallint(5) unsigned NOT NULL DEFAULT 0,
  `last_notice_at` datetime DEFAULT NULL,
  `customs_reported_at` datetime DEFAULT NULL,
  `status` enum('active','cleared','auction_transferred','waived') NOT NULL DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_overstay_consignment` (`consignment_id`),
  KEY `idx_overstay_container` (`container_id`),
  KEY `idx_overstay_status` (`status`),
  CONSTRAINT `fk_overstay_consignment` FOREIGN KEY (`consignment_id`) REFERENCES `consignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_overstay_container` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `operational_overrides` (
  `id` char(36) NOT NULL,
  `reference` varchar(50) NOT NULL,
  `kind` enum('Gate-In Without Pre-Booking','Hold Clearance Override','Storage Fee Waiver Override','Seal Discrepancy Gate Release','Credit Limit Bypass','Manual Status Override') NOT NULL,
  `consignment_id` char(36) DEFAULT NULL,
  `container_id` char(36) DEFAULT NULL,
  `container_no` varchar(50) DEFAULT NULL,
  `requested_by` varchar(150) NOT NULL,
  `requested_by_role` varchar(100) NOT NULL,
  `requested_by_user_id` char(36) DEFAULT NULL,
  `reason` text NOT NULL,
  `justification_doc_url` varchar(500) DEFAULT NULL,
  `status` enum('Pending Approval','Approved','Rejected','Expired') NOT NULL DEFAULT 'Pending Approval',
  `approved_by` varchar(150) DEFAULT NULL,
  `approved_by_user_id` char(36) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approval_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_override_ref` (`reference`),
  KEY `idx_override_status` (`status`),
  CONSTRAINT `fk_override_requester` FOREIGN KEY (`requested_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_override_approver` FOREIGN KEY (`approved_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_override_consignment` FOREIGN KEY (`consignment_id`) REFERENCES `consignments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_override_container` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cargo_claims` (
  `id` char(36) NOT NULL,
  `claim_reference` varchar(50) NOT NULL,
  `consignment_id` char(36) NOT NULL,
  `container_id` char(36) DEFAULT NULL,
  `organisation_id` char(36) NOT NULL,
  `claim_kind` enum('Cargo damage upon arrival','Missing packages from manifest','Seal tampering identified','Water / Weather ingress damage','Terminal handling dispute','Excessive turnaround delay') NOT NULL,
  `description` text NOT NULL,
  `claimed_amount` decimal(15,2) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'NGN',
  `evidence_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`evidence_urls`)),
  `status` enum('submitted','under_investigation','accepted','partially_accepted','rejected','settled') NOT NULL DEFAULT 'submitted',
  `investigator_id` char(36) DEFAULT NULL,
  `investigation_notes` text DEFAULT NULL,
  `settled_amount` decimal(15,2) DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_claim_ref` (`claim_reference`),
  KEY `idx_claim_consignment` (`consignment_id`),
  KEY `idx_claim_org` (`organisation_id`),
  CONSTRAINT `fk_claim_consignment` FOREIGN KEY (`consignment_id`) REFERENCES `consignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_claim_container` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_claim_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`),
  CONSTRAINT `fk_claim_investigator` FOREIGN KEY (`investigator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `gate_movements`;
DROP TABLE IF EXISTS `gate_passes`;
DROP TABLE IF EXISTS `gate_appointments`;
DROP TABLE IF EXISTS `gate_slots`;
DROP TABLE IF EXISTS `drivers`;
DROP TABLE IF EXISTS `vehicles`;
DROP TABLE IF EXISTS `transporters`;

CREATE TABLE `transporters` (
  `id` char(36) NOT NULL,
  `organisation_id` char(36) DEFAULT NULL,
  `company_name` varchar(255) NOT NULL,
  `rc_number` varchar(100) DEFAULT NULL,
  `contact_person` varchar(150) NOT NULL,
  `phone` varchar(25) NOT NULL,
  `email` varchar(254) NOT NULL,
  `fleet_size` int(10) unsigned NOT NULL DEFAULT 1,
  `safety_compliance_status` enum('approved','pending','suspended') NOT NULL DEFAULT 'approved',
  `insurance_policy_number` varchar(100) DEFAULT NULL,
  `insurance_expiry` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_transporter_org` (`organisation_id`),
  CONSTRAINT `fk_transporter_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vehicles` (
  `id` char(36) NOT NULL,
  `transporter_id` char(36) DEFAULT NULL,
  `plate` varchar(50) NOT NULL,
  `kind` enum('Flatbed','Container','Reefer','Box','Tanker') NOT NULL DEFAULT 'Flatbed',
  `make` varchar(80) NOT NULL,
  `model` varchar(80) NOT NULL,
  `year` varchar(10) NOT NULL,
  `tare_weight_kg` decimal(10,2) DEFAULT NULL,
  `max_payload_tonnes` decimal(8,2) DEFAULT 30.00,
  `roadworthiness_expiry` date DEFAULT NULL,
  `insurance_expiry` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vehicle_plate` (`plate`),
  KEY `idx_vehicle_transporter` (`transporter_id`),
  CONSTRAINT `fk_vehicle_transporter` FOREIGN KEY (`transporter_id`) REFERENCES `transporters` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `drivers` (
  `id` char(36) NOT NULL,
  `transporter_id` char(36) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `phone` varchar(25) NOT NULL,
  `national_id_nin` varchar(50) DEFAULT NULL,
  `licence_number` varchar(100) NOT NULL,
  `licence_class` varchar(20) NOT NULL DEFAULT 'E (Heavy Duty)',
  `licence_expiry` date NOT NULL,
  `photo_url` varchar(500) DEFAULT NULL,
  `status` enum('active','suspended','blacklisted') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_driver_licence` (`licence_number`),
  KEY `idx_driver_transporter` (`transporter_id`),
  KEY `idx_driver_phone` (`phone`),
  CONSTRAINT `fk_driver_transporter` FOREIGN KEY (`transporter_id`) REFERENCES `transporters` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gate_slots` (
  `id` char(36) NOT NULL,
  `slot_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `slot_code` varchar(50) NOT NULL,
  `zone_or_lane` varchar(50) NOT NULL DEFAULT 'Lane 1',
  `max_capacity` int(10) unsigned NOT NULL DEFAULT 10,
  `booked_count` int(10) unsigned NOT NULL DEFAULT 0,
  `is_blacked_out` tinyint(1) NOT NULL DEFAULT 0,
  `blackout_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gate_slot_time` (`slot_date`,`start_time`,`zone_or_lane`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gate_appointments` (
  `id` char(36) NOT NULL,
  `appointment_ref` varchar(50) NOT NULL,
  `slot_id` char(36) DEFAULT NULL,
  `slot_time` varchar(50) NOT NULL,
  `consignment_id` char(36) NOT NULL,
  `container_id` char(36) DEFAULT NULL,
  `container_no` varchar(50) NOT NULL,
  `cargo_ref` varchar(50) NOT NULL,
  `transporter_id` char(36) DEFAULT NULL,
  `transporter_name` varchar(255) NOT NULL,
  `vehicle_id` char(36) DEFAULT NULL,
  `truck_no` varchar(50) NOT NULL,
  `driver_id` char(36) DEFAULT NULL,
  `driver_name` varchar(150) NOT NULL,
  `driver_phone` varchar(25) NOT NULL,
  `appointment_type` enum('collection','delivery_dropoff','empty_return','examination') NOT NULL DEFAULT 'collection',
  `readiness_verified` tinyint(1) NOT NULL DEFAULT 1,
  `financial_cleared` tinyint(1) NOT NULL DEFAULT 1,
  `holds_cleared` tinyint(1) NOT NULL DEFAULT 1,
  `status` enum('Booked','Confirmed','Queued','Admitted','Loading','Completed','Referred','Cancelled','No Show') NOT NULL DEFAULT 'Booked',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_appointment_ref` (`appointment_ref`),
  KEY `idx_appt_consignment` (`consignment_id`),
  KEY `idx_appt_container` (`container_id`),
  KEY `idx_appt_truck` (`truck_no`),
  KEY `idx_appt_status` (`status`),
  CONSTRAINT `fk_appt_slot` FOREIGN KEY (`slot_id`) REFERENCES `gate_slots` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appt_consignment` FOREIGN KEY (`consignment_id`) REFERENCES `consignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appt_container` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appt_transporter` FOREIGN KEY (`transporter_id`) REFERENCES `transporters` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appt_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appt_driver` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gate_passes` (
  `id` char(36) NOT NULL,
  `pass_code` varchar(50) NOT NULL,
  `appointment_id` char(36) DEFAULT NULL,
  `truck_no` varchar(50) NOT NULL,
  `driver_name` varchar(150) NOT NULL,
  `container_no` varchar(50) DEFAULT NULL,
  `pass_type` enum('Terminal Entry','Gate-Out Clearance','Collection','Visitor') NOT NULL,
  `qr_hash` varchar(255) NOT NULL,
  `short_verification_code` varchar(20) NOT NULL,
  `valid_from` datetime NOT NULL,
  `valid_until` datetime NOT NULL,
  `issued_at` datetime NOT NULL,
  `issued_by` char(36) DEFAULT NULL,
  `status` enum('Active','Admitted','Cleared Out','Expired','Revoked') NOT NULL DEFAULT 'Active',
  `revoked_reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gate_pass_code` (`pass_code`),
  UNIQUE KEY `uq_gate_pass_short` (`short_verification_code`),
  KEY `idx_gp_truck` (`truck_no`),
  KEY `idx_gp_status` (`status`),
  CONSTRAINT `fk_gp_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `gate_appointments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_gp_issuer` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gate_movements` (
  `id` char(36) NOT NULL,
  `gate_pass_id` char(36) DEFAULT NULL,
  `appointment_id` char(36) DEFAULT NULL,
  `movement_type` enum('gate_in','gate_out') NOT NULL,
  `lane` varchar(50) NOT NULL DEFAULT 'Lane 2',
  `gate_officer_id` char(36) DEFAULT NULL,
  `gate_officer_name` varchar(150) NOT NULL,
  `truck_plate` varchar(50) NOT NULL,
  `driver_name` varchar(150) NOT NULL,
  `container_no` varchar(50) DEFAULT NULL,
  `cargo_ref` varchar(50) DEFAULT NULL,
  `weighbridge_gross_kg` decimal(10,2) DEFAULT NULL,
  `weighbridge_tare_kg` decimal(10,2) DEFAULT NULL,
  `weighbridge_ticket_ref` varchar(50) DEFAULT NULL,
  `anpr_plate_detected` varchar(50) DEFAULT NULL,
  `anpr_matched` tinyint(1) NOT NULL DEFAULT 1,
  `seal_verified` tinyint(1) NOT NULL DEFAULT 1,
  `loaded_quantity_verified` tinyint(1) NOT NULL DEFAULT 1,
  `decision` enum('Admitted','Referred','Rejected','Overridden') NOT NULL DEFAULT 'Admitted',
  `decision_details` varchar(255) NOT NULL DEFAULT 'In · Lane 2',
  `reason` varchar(255) DEFAULT NULL,
  `override_reference` varchar(50) DEFAULT NULL,
  `timestamp` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_gm_pass` (`gate_pass_id`),
  KEY `idx_gm_truck` (`truck_plate`),
  KEY `idx_gm_time` (`timestamp`),
  CONSTRAINT `fk_gm_pass` FOREIGN KEY (`gate_pass_id`) REFERENCES `gate_passes` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_gm_appt` FOREIGN KEY (`appointment_id`) REFERENCES `gate_appointments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_gm_officer` FOREIGN KEY (`gate_officer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `document_verification_logs`;
DROP TABLE IF EXISTS `documents`;

CREATE TABLE `documents` (
  `id` char(36) NOT NULL,
  `consignment_id` char(36) DEFAULT NULL,
  `container_id` char(36) DEFAULT NULL,
  `organisation_id` char(36) DEFAULT NULL,
  `document_name` varchar(255) NOT NULL,
  `document_type` enum(
    'Commercial Invoice',
    'Packing List',
    'Bill of Lading',
    'Customs Release Document',
    'Delivery Order',
    'Terminal Delivery Order (TDO)',
    'Tally Sheet',
    'Gate Pass',
    'Weighbridge Certificate',
    'Equipment Interchange Receipt (EIR)',
    'Inspection Certificate',
    'Customs Single Goods Declaration (SGD)',
    'Proof of Payment',
    'Identity Document',
    'Other'
  ) NOT NULL,
  `document_reference` varchar(100) NOT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `file_size_bytes` bigint(20) unsigned DEFAULT NULL,
  `file_mime_type` varchar(100) DEFAULT 'application/pdf',
  `sha256_hash` varchar(64) DEFAULT NULL,
  `version_tag` varchar(20) NOT NULL DEFAULT 'v1',
  `uploaded_by_name` varchar(150) NOT NULL,
  `uploaded_by_user_id` char(36) DEFAULT NULL,
  `is_system_generated` tinyint(1) NOT NULL DEFAULT 0,
  `digital_seal_code` varchar(100) DEFAULT NULL,
  `verification_code` varchar(50) NOT NULL,
  `verification_status` enum('Required','Uploaded','Under review','Verified','Rejected','Revoked') NOT NULL DEFAULT 'Uploaded',
  `verified_by` char(36) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `rejection_reason` varchar(255) DEFAULT NULL,
  `is_legal_hold` tinyint(1) NOT NULL DEFAULT 0,
  `expiry_date` date DEFAULT NULL,
  `issue_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_doc_verification_code` (`verification_code`),
  KEY `idx_doc_consignment` (`consignment_id`),
  KEY `idx_doc_container` (`container_id`),
  KEY `idx_doc_org` (`organisation_id`),
  KEY `idx_doc_status` (`verification_status`),
  CONSTRAINT `fk_doc_consignment` FOREIGN KEY (`consignment_id`) REFERENCES `consignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doc_container` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_doc_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_doc_uploader` FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_doc_verifier` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `document_verification_logs` (
  `id` char(36) NOT NULL,
  `document_id` char(36) DEFAULT NULL,
  `verification_code` varchar(50) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `outcome` enum('verified_authentic','invalid_code','revoked_document','tampered_hash') NOT NULL,
  `verified_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_dv_doc` (`document_id`),
  KEY `idx_dv_code` (`verification_code`),
  CONSTRAINT `fk_dv_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DROP TABLE IF EXISTS `payment_disputes`;
DROP TABLE IF EXISTS `statement_of_account_entries`;
DROP TABLE IF EXISTS `dunning_collections`;
DROP TABLE IF EXISTS `customer_credit_applications`;
DROP TABLE IF EXISTS `customer_credit_profiles`;
DROP TABLE IF EXISTS `financial_approvals`;
DROP TABLE IF EXISTS `bank_statement_lines`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `invoice_items`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `charge_lines`;
DROP TABLE IF EXISTS `tax_rules`;
DROP TABLE IF EXISTS `storage_escalation_rules`;
DROP TABLE IF EXISTS `tariffs`;

CREATE TABLE `tariffs` (
  `id` char(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` varchar(255) NOT NULL,
  `category` enum('Handling','Storage','Specialized','Other','Value-Added') NOT NULL,
  `unit` varchar(50) NOT NULL DEFAULT 'Per container',
  `rate_20ft` decimal(15,2) NOT NULL DEFAULT 0.00,
  `rate_40ft` decimal(15,2) NOT NULL DEFAULT 0.00,
  `base_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) NOT NULL DEFAULT 'NGN',
  `free_days` int(10) unsigned NOT NULL DEFAULT 0,
  `effective_date` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tariff_code` (`code`),
  KEY `idx_tariff_cat` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `storage_escalation_rules` (
  `id` char(36) NOT NULL,
  `tariff_id` char(36) NOT NULL,
  `tier_name` varchar(50) NOT NULL,
  `from_day` int(10) unsigned NOT NULL,
  `to_day` int(10) unsigned DEFAULT NULL,
  `daily_rate_20ft` decimal(15,2) NOT NULL,
  `daily_rate_40ft` decimal(15,2) NOT NULL,
  `is_overstay_tier` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_ser_tariff` (`tariff_id`),
  CONSTRAINT `fk_ser_tariff` FOREIGN KEY (`tariff_id`) REFERENCES `tariffs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tax_rules` (
  `id` char(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `kind` enum('Percentage','Fixed','Surcharge') NOT NULL DEFAULT 'Percentage',
  `rate` decimal(8,4) NOT NULL DEFAULT 7.5000,
  `applies_to` varchar(150) NOT NULL DEFAULT 'All Services',
  `is_deductible` tinyint(1) NOT NULL DEFAULT 0,
  `effective_from` date NOT NULL,
  `effective_to` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tax_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `charge_lines` (
  `id` char(36) NOT NULL,
  `consignment_id` char(36) NOT NULL,
  `container_id` char(36) DEFAULT NULL,
  `tariff_id` char(36) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 1.00,
  `unit_price` decimal(15,2) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'NGN',
  `source_event_type` varchar(100) DEFAULT NULL,
  `is_invoiced` tinyint(1) NOT NULL DEFAULT 0,
  `invoice_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_charge_consignment` (`consignment_id`),
  KEY `idx_charge_container` (`container_id`),
  KEY `idx_charge_tariff` (`tariff_id`),
  KEY `idx_charge_invoiced` (`is_invoiced`),
  CONSTRAINT `fk_charge_consignment` FOREIGN KEY (`consignment_id`) REFERENCES `consignments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_charge_container` FOREIGN KEY (`container_id`) REFERENCES `containers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_charge_tariff` FOREIGN KEY (`tariff_id`) REFERENCES `tariffs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invoices` (
  `id` char(36) NOT NULL,
  `number` varchar(50) NOT NULL,
  `invoice_type` enum('proforma','final','supplementary','credit_note') NOT NULL DEFAULT 'final',
  `category` enum('Full terminal charge','Storage escalation','Handling','Storage','Value-Added Services') NOT NULL DEFAULT 'Full terminal charge',
  `consignment_id` char(36) DEFAULT NULL,
  `organisation_id` char(36) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `bill_of_lading` varchar(100) DEFAULT NULL,
  `container_no` varchar(50) DEFAULT NULL,
  `subtotal_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `amount_paid` decimal(15,2) NOT NULL DEFAULT 0.00,
  `balance_due` decimal(15,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) NOT NULL DEFAULT 'NGN',
  `issued_date` date NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('Draft','Issued','Paid','Partially Paid','Overdue','Cancelled','Disputed') NOT NULL DEFAULT 'Issued',
  `issued_by` char(36) DEFAULT NULL,
  `payment_terms_days` int(10) unsigned NOT NULL DEFAULT 7,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invoice_number` (`number`),
  KEY `idx_inv_consignment` (`consignment_id`),
  KEY `idx_inv_org` (`organisation_id`),
  KEY `idx_inv_status` (`status`),
  KEY `idx_inv_due` (`due_date`),
  CONSTRAINT `fk_inv_consignment` FOREIGN KEY (`consignment_id`) REFERENCES `consignments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inv_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`),
  CONSTRAINT `fk_inv_issuer` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invoice_items` (
  `id` char(36) NOT NULL,
  `invoice_id` char(36) NOT NULL,
  `charge_line_id` char(36) DEFAULT NULL,
  `tariff_code` varchar(50) NOT NULL,
  `item_description` varchar(255) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT 1.00,
  `unit_rate` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_rate` decimal(8,4) NOT NULL DEFAULT 7.5000,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `idx_ii_invoice` (`invoice_id`),
  CONSTRAINT `fk_ii_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ii_charge` FOREIGN KEY (`charge_line_id`) REFERENCES `charge_lines` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payments` (
  `id` char(36) NOT NULL,
  `receipt_number` varchar(50) NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `invoice_id` char(36) DEFAULT NULL,
  `organisation_id` char(36) NOT NULL,
  `channel` enum('Bank Transfer','Card Payment','USSD','Terminal Credit','Direct Debit','Cheque') NOT NULL DEFAULT 'Bank Transfer',
  `gateway` varchar(50) NOT NULL DEFAULT 'nibss_instant',
  `amount` decimal(15,2) NOT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'NGN',
  `transaction_reference` varchar(100) DEFAULT NULL,
  `bank_name` varchar(150) DEFAULT NULL,
  `proof_of_payment_url` varchar(500) DEFAULT NULL,
  `status` enum('initiated','pending_confirmation','confirmed','failed','refunded','disputed') NOT NULL DEFAULT 'confirmed',
  `confirmed_by` char(36) DEFAULT NULL,
  `confirmed_at` datetime DEFAULT NULL,
  `idempotency_key` varchar(100) DEFAULT NULL,
  `payment_date` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payment_receipt` (`receipt_number`),
  KEY `idx_payment_invoice` (`invoice_id`),
  KEY `idx_payment_org` (`organisation_id`),
  KEY `idx_payment_status` (`status`),
  CONSTRAINT `fk_payment_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_payment_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`),
  CONSTRAINT `fk_payment_confirmer` FOREIGN KEY (`confirmed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bank_statement_lines` (
  `id` char(36) NOT NULL,
  `statement_date` date NOT NULL,
  `value_date` date NOT NULL,
  `description` varchar(255) NOT NULL,
  `reference` varchar(100) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `direction` enum('credit','debit') NOT NULL DEFAULT 'credit',
  `bank_account` varchar(100) NOT NULL DEFAULT 'First Bank - 2038192019',
  `status` enum('Unmatched','Matched','Manual Reconciled','Flagged') NOT NULL DEFAULT 'Unmatched',
  `matched_payment_id` char(36) DEFAULT NULL,
  `reconciled_by` char(36) DEFAULT NULL,
  `reconciled_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bank_ref` (`reference`),
  KEY `idx_bsl_status` (`status`),
  CONSTRAINT `fk_bsl_payment` FOREIGN KEY (`matched_payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_bsl_reconciler` FOREIGN KEY (`reconciled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `financial_approvals` (
  `id` char(36) NOT NULL,
  `reference` varchar(50) NOT NULL,
  `kind` enum('Storage Fee Waiver','Invoice Discount Request','Credit Note Issuance','Refund Request','Bad Debt Write-off') NOT NULL,
  `organisation_id` char(36) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `account_ref` varchar(50) NOT NULL,
  `invoice_id` char(36) DEFAULT NULL,
  `invoice_ref` varchar(50) NOT NULL,
  `original_amount` decimal(15,2) NOT NULL,
  `adjustment_amount` decimal(15,2) NOT NULL,
  `final_amount` decimal(15,2) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('Pending Approval','Approved','Rejected','Escalated') NOT NULL DEFAULT 'Pending Approval',
  `requested_by` char(36) DEFAULT NULL,
  `requested_by_name` varchar(150) NOT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `approved_by_name` varchar(150) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approval_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fin_app_ref` (`reference`),
  KEY `idx_fa_org` (`organisation_id`),
  KEY `idx_fa_status` (`status`),
  CONSTRAINT `fk_fa_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`),
  CONSTRAINT `fk_fa_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_fa_requester` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_fa_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customer_credit_profiles` (
  `id` char(36) NOT NULL,
  `organisation_id` char(36) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `account_ref` varchar(50) NOT NULL,
  `tier` enum('Standard','Silver','Gold','Platinum') NOT NULL DEFAULT 'Standard',
  `credit_limit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `exposure` decimal(15,2) NOT NULL DEFAULT 0.00,
  `available_credit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `terms_days` int(10) unsigned NOT NULL DEFAULT 14,
  `is_blocked` tinyint(1) NOT NULL DEFAULT 0,
  `blocked_reason` varchar(255) DEFAULT NULL,
  `approved_by` char(36) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ccp_org` (`organisation_id`),
  UNIQUE KEY `uq_ccp_account_ref` (`account_ref`),
  CONSTRAINT `fk_ccp_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ccp_approver` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customer_credit_applications` (
  `id` char(36) NOT NULL,
  `organisation_id` char(36) NOT NULL,
  `requested_tier` enum('Standard','Silver','Gold','Platinum') NOT NULL,
  `requested_limit` decimal(15,2) NOT NULL,
  `average_monthly_volume_containers` int(10) unsigned NOT NULL,
  `bank_guarantee_reference` varchar(100) DEFAULT NULL,
  `financial_statements_url` varchar(500) DEFAULT NULL,
  `status` enum('Pending Review','Under Evaluation','Approved','Rejected') NOT NULL DEFAULT 'Pending Review',
  `reviewed_by` char(36) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_cca_org` (`organisation_id`),
  CONSTRAINT `fk_cca_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cca_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `statement_of_account_entries` (
  `id` char(36) NOT NULL,
  `organisation_id` char(36) NOT NULL,
  `entry_date` date NOT NULL,
  `reference` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `entry_type` enum('Invoice','Receipt','Adjustment','Credit note') NOT NULL,
  `debit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `credit` decimal(15,2) NOT NULL DEFAULT 0.00,
  `running_balance` decimal(15,2) NOT NULL DEFAULT 0.00,
  `invoice_id` char(36) DEFAULT NULL,
  `payment_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_stmt_org` (`organisation_id`),
  KEY `idx_stmt_date` (`entry_date`),
  CONSTRAINT `fk_stmt_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_stmt_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_stmt_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payment_disputes` (
  `id` char(36) NOT NULL,
  `dispute_reference` varchar(50) NOT NULL,
  `invoice_id` char(36) NOT NULL,
  `organisation_id` char(36) NOT NULL,
  `dispute_reason` enum('Calculation error in storage days','Days already cleared by Customs waiver','Duplicate billing line item','Waiver approved but not reflected on invoice','Payment made but not reconciled','Damaged cargo demurrage dispute') NOT NULL,
  `description` text NOT NULL,
  `disputed_amount` decimal(15,2) NOT NULL,
  `evidence_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`evidence_urls`)),
  `status` enum('Submitted','Under Review','Approved & Credited','Rejected') NOT NULL DEFAULT 'Submitted',
  `assigned_to` char(36) DEFAULT NULL,
  `resolution_notes` text DEFAULT NULL,
  `credit_note_ref` varchar(50) DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dispute_ref` (`dispute_reference`),
  KEY `idx_dispute_inv` (`invoice_id`),
  KEY `idx_dispute_org` (`organisation_id`),
  CONSTRAINT `fk_dispute_inv` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dispute_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`),
  CONSTRAINT `fk_dispute_assignee` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `dunning_collections` (
  `id` char(36) NOT NULL,
  `organisation_id` char(36) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `account_ref` varchar(50) NOT NULL,
  `invoice_id` char(36) NOT NULL,
  `invoice_ref` varchar(50) NOT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `days_overdue` int(10) unsigned NOT NULL,
  `dunning_stage` enum('Stage 1 - Friendly Reminder','Stage 2 - Formal Overdue Notice','Stage 3 - Final Demand','Stage 4 - Gate Block / Legal Escalation') NOT NULL DEFAULT 'Stage 1 - Friendly Reminder',
  `notices_sent` smallint(5) unsigned NOT NULL DEFAULT 0,
  `last_notice_date` datetime DEFAULT NULL,
  `promise_to_pay_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_dunning_org` (`organisation_id`),
  KEY `idx_dunning_invoice` (`invoice_id`),
  CONSTRAINT `fk_dunning_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`),
  CONSTRAINT `fk_dunning_inv` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `contact_inquiries`;
DROP TABLE IF EXISTS `career_applications`;
DROP TABLE IF EXISTS `career_openings`;
DROP TABLE IF EXISTS `faqs`;
DROP TABLE IF EXISTS `articles_and_notices`;

CREATE TABLE `articles_and_notices` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `category` enum('All','Notices','Customs & Compliance','Infrastructure','Technology') NOT NULL DEFAULT 'Notices',
  `summary` text NOT NULL,
  `body` longtext NOT NULL,
  `featured_image_url` varchar(500) DEFAULT NULL,
  `author_name` varchar(150) NOT NULL DEFAULT 'TRINU Editorial Desk',
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `published_at` datetime NOT NULL,
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `read_time_mins` int(10) unsigned NOT NULL DEFAULT 3,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_article_slug` (`slug`),
  KEY `idx_article_cat` (`category`),
  KEY `idx_article_pub` (`is_published`,`published_at`),
  CONSTRAINT `fk_article_author` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `faqs` (
  `id` char(36) NOT NULL,
  `question` varchar(500) NOT NULL,
  `answer` text NOT NULL,
  `category` enum('Tracking & Status','Documentation & Customs','Invoicing & Tariffs','Gate & VBS Appointments','Storage & Dwell Time','General') NOT NULL DEFAULT 'General',
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_faq_cat` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `career_openings` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `department` enum('Terminal Operations','Customs Liaison & Compliance','Finance & Billing','Health, Safety & Environment (HSE)','Technology & Systems','Security & Gate') NOT NULL,
  `employment_type` enum('Full-time','Contract','Shift-based') NOT NULL DEFAULT 'Full-time',
  `location` varchar(150) NOT NULL DEFAULT 'Abuja Bonded Terminal',
  `summary` text NOT NULL,
  `responsibilities` text DEFAULT NULL,
  `requirements` text DEFAULT NULL,
  `closing_date` date DEFAULT NULL,
  `is_open` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_career_open` (`is_open`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `career_applications` (
  `id` char(36) NOT NULL,
  `career_opening_id` char(36) NOT NULL,
  `applicant_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `phone` varchar(25) NOT NULL,
  `resume_url` varchar(500) NOT NULL,
  `cover_letter` text DEFAULT NULL,
  `status` enum('received','under_review','shortlisted','interviewed','rejected','hired') NOT NULL DEFAULT 'received',
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_app_career` (`career_opening_id`),
  CONSTRAINT `fk_app_career` FOREIGN KEY (`career_opening_id`) REFERENCES `career_openings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `contact_inquiries` (
  `id` char(36) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `phone` varchar(25) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `department` enum('General Inquiries','Terminal Operations','Finance & Billing','Customs Documentation Support','Transporter & VBS Helpdesk') NOT NULL DEFAULT 'General Inquiries',
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` enum('new','in_progress','resolved','closed') NOT NULL DEFAULT 'new',
  `assigned_to` char(36) DEFAULT NULL,
  `response_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_contact_status` (`status`),
  CONSTRAINT `fk_contact_assignee` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `user_notification_preferences`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `notification_templates`;

CREATE TABLE `notification_templates` (
  `id` char(36) NOT NULL,
  `template_key` varchar(100) NOT NULL,
  `event_trigger` varchar(100) NOT NULL,
  `channel` enum('in_app','email','sms','whatsapp') NOT NULL DEFAULT 'in_app',
  `subject_template` varchar(255) NOT NULL,
  `body_template` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_template_key_channel` (`template_key`,`channel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `organisation_id` char(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `detail` text NOT NULL,
  `category` enum('Documents','Examination','Holds','Gate','Finance','Operations','System') NOT NULL DEFAULT 'Operations',
  `tone` enum('info','warning','critical','success') NOT NULL DEFAULT 'info',
  `channel` enum('in_app','email','sms','whatsapp') NOT NULL DEFAULT 'in_app',
  `link_url` varchar(255) DEFAULT NULL,
  `status` enum('unread','read','archived') NOT NULL DEFAULT 'unread',
  `read_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_notif_user` (`user_id`),
  KEY `idx_notif_org` (`organisation_id`),
  KEY `idx_notif_status` (`status`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notif_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_notification_preferences` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `channel` enum('email','sms','whatsapp','in_app') NOT NULL,
  `category` varchar(50) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `quiet_hours_start` time DEFAULT NULL,
  `quiet_hours_end` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_notif_pref` (`user_id`,`channel`,`category`),
  CONSTRAINT `fk_unp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `scheduled_reports`;
DROP TABLE IF EXISTS `hardware_readings`;
DROP TABLE IF EXISTS `integration_logs`;
DROP TABLE IF EXISTS `integration_endpoints`;

CREATE TABLE `integration_endpoints` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `integration_type` enum('customs_bodogwu','shipping_line_edi','payment_gateway','messaging_sms','messaging_whatsapp','weighbridge','anpr_camera','accounting_erp') NOT NULL,
  `status` enum('Active','Degraded','Offline','Disabled') NOT NULL DEFAULT 'Active',
  `endpoint_url` varchar(500) DEFAULT NULL,
  `auth_type` enum('bearer','basic','api_key','mutual_tls','none') NOT NULL DEFAULT 'api_key',
  `last_ping_at` datetime DEFAULT NULL,
  `last_success_at` datetime DEFAULT NULL,
  `error_count` int(10) unsigned NOT NULL DEFAULT 0,
  `config_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config_json`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_integration_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `integration_logs` (
  `id` char(36) NOT NULL,
  `endpoint_id` char(36) NOT NULL,
  `direction` enum('inbound','outbound') NOT NULL,
  `message_type` varchar(100) NOT NULL,
  `correlation_id` varchar(100) NOT NULL,
  `request_payload` longtext DEFAULT NULL,
  `response_payload` longtext DEFAULT NULL,
  `http_status` smallint(5) unsigned DEFAULT NULL,
  `execution_time_ms` int(10) unsigned DEFAULT NULL,
  `status` enum('success','failed','quarantined','retrying') NOT NULL DEFAULT 'success',
  `retry_count` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_il_endpoint` (`endpoint_id`),
  KEY `idx_il_correlation` (`correlation_id`),
  KEY `idx_il_time` (`created_at`),
  CONSTRAINT `fk_il_endpoint` FOREIGN KEY (`endpoint_id`) REFERENCES `integration_endpoints` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `hardware_readings` (
  `id` char(36) NOT NULL,
  `device_type` enum('weighbridge','anpr_camera','rfid_reader','barcode_scanner','barrier_gate') NOT NULL,
  `device_identifier` varchar(100) NOT NULL,
  `location_name` varchar(150) NOT NULL DEFAULT 'Gate 2',
  `reading_type` enum('gross_weight','tare_weight','license_plate','rfid_tag','barcode_scan','barrier_status') NOT NULL,
  `raw_value` varchar(255) NOT NULL,
  `matched_entity_type` varchar(50) DEFAULT NULL,
  `matched_entity_id` char(36) DEFAULT NULL,
  `operator_id` char(36) DEFAULT NULL,
  `timestamp` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_hr_device` (`device_identifier`),
  KEY `idx_hr_time` (`timestamp`),
  CONSTRAINT `fk_hr_operator` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `scheduled_reports` (
  `id` char(36) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` enum('Operations','Finance','Compliance','Audit') NOT NULL,
  `frequency` enum('Daily (06:00 WAT)','Weekly (Monday)','Monthly (1st of Month)') NOT NULL,
  `format` enum('CSV / Excel','PDF Dossier','JSON Stream') NOT NULL DEFAULT 'CSV / Excel',
  `recipients` text NOT NULL,
  `filters_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`filters_config`)),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_run_at` datetime DEFAULT NULL,
  `next_run_at` datetime DEFAULT NULL,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_sr_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `data_subject_requests`;
DROP TABLE IF EXISTS `ndpa_data_protection_consents`;
DROP TABLE IF EXISTS `system_maintenance_notices`;
DROP TABLE IF EXISTS `feature_flags`;
DROP TABLE IF EXISTS `system_configurations`;
DROP TABLE IF EXISTS `system_audit_logs`;

CREATE TABLE `system_audit_logs` (
  `id` char(36) NOT NULL,
  `timestamp` datetime NOT NULL,
  `actor` varchar(150) NOT NULL,
  `actor_id` char(36) DEFAULT NULL,
  `event` varchar(255) NOT NULL,
  `resource` varchar(255) NOT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` varchar(100) DEFAULT NULL,
  `before_state` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`before_state`)),
  `after_state` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`after_state`)),
  `ip` varchar(45) NOT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `status` enum('Success','Flagged','Blocked') NOT NULL DEFAULT 'Success',
  `hash` varchar(64) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_audit_actor` (`actor_id`),
  KEY `idx_audit_resource` (`resource`),
  KEY `idx_audit_time` (`timestamp`),
  KEY `idx_audit_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `system_configurations` (
  `id` char(36) NOT NULL,
  `config_key` varchar(100) NOT NULL,
  `config_value` text NOT NULL,
  `value_type` enum('string','number','boolean','json') NOT NULL DEFAULT 'string',
  `category` enum('terminal_rules','vbs_rules','storage_rules','security','notification','branding','general') NOT NULL DEFAULT 'general',
  `description` varchar(500) DEFAULT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 0,
  `updated_by` char(36) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_config_key` (`config_key`),
  KEY `idx_config_cat` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `feature_flags` (
  `id` char(36) NOT NULL,
  `flag_key` varchar(100) NOT NULL,
  `flag_name` varchar(150) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `description` varchar(500) DEFAULT NULL,
  `rollout_percentage` tinyint(3) unsigned NOT NULL DEFAULT 100,
  `target_roles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_roles`)),
  `updated_by` char(36) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_flag_key` (`flag_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `system_maintenance_notices` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `banner_type` enum('info','warning','maintenance_blackout') NOT NULL DEFAULT 'info',
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ndpa_data_protection_consents` (
  `id` char(36) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `organisation_id` char(36) DEFAULT NULL,
  `consent_type` enum('terms_of_service','privacy_policy','sms_notifications','whatsapp_notifications','driver_biometric_anpr','marketing') NOT NULL,
  `version` varchar(30) NOT NULL DEFAULT '1.0',
  `ip_address` varchar(45) NOT NULL,
  `consent_granted` tinyint(1) NOT NULL DEFAULT 1,
  `granted_at` datetime NOT NULL,
  `withdrawn_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ndpa_user` (`user_id`),
  KEY `idx_ndpa_org` (`organisation_id`),
  CONSTRAINT `fk_ndpa_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ndpa_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `data_subject_requests` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `request_type` enum('access','rectification','erasure','portability') NOT NULL,
  `justification` text NOT NULL,
  `status` enum('submitted','under_review','fulfilled','rejected') NOT NULL DEFAULT 'submitted',
  `due_date` date NOT NULL,
  `fulfilled_at` datetime DEFAULT NULL,
  `response_summary` text DEFAULT NULL,
  `processed_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_dsr_user` (`user_id`),
  CONSTRAINT `fk_dsr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dsr_processor` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

LOCK TABLES `terminal_locations` WRITE;
INSERT INTO `terminal_locations` VALUES 
('loc-yard-a','YARD-A','Container Yard Block A','yard',1,1200,36000.00,450,'standard','{}','active','2026-09-01 00:00:00'),
('loc-yard-b','YARD-B','Container Yard Block B','yard',1,1400,42000.00,720,'standard','{}','active','2026-09-01 00:00:00'),
('loc-yard-c','YARD-C','Container Yard Block C','yard',1,1000,30000.00,580,'standard','{}','active','2026-09-01 00:00:00'),
('loc-bond-wh','BOND-WH','Bonded Warehouse Bay 1 & 2','warehouse',1,500,24000.00,210,'high','{}','active','2026-09-01 00:00:00'),
('loc-cold-bay','COLD-BAY','Reefer & Cold Storage Bay','cold_storage',1,200,6000.00,45,'high','{}','active','2026-09-01 00:00:00'),
('loc-gate-01','GATE-COMPLEX','Main Inbound/Outbound Gate Lanes','gate',0,50,0.00,8,'high','{}','active','2026-09-01 00:00:00'),
('loc-insp-01','EXAM-BAY','Joint Customs Examination Bay 1','examination_bay',1,80,2400.00,12,'restricted','{}','active','2026-09-01 00:00:00');
UNLOCK TABLES;

LOCK TABLES `yard_slots` WRITE;
INSERT INTO `yard_slots` VALUES 
('ys-a04','loc-yard-a','Yard A','Block A','Row 04','A04',1,1,35.00,'Occupied','2026-09-02 08:00:00'),
('ys-b02','loc-yard-b','Yard B','Block B','Row 02','B02',1,1,35.00,'Occupied','2026-09-07 09:30:00'),
('ys-c05','loc-yard-c','Yard C','Block C','Row 05','C05',1,1,35.00,'Occupied','2026-09-04 10:15:00'),
('ys-a01','loc-yard-a','Yard A','Block A','Row 01','A01',1,1,35.00,'Empty','2026-09-01 00:00:00'),
('ys-b01','loc-yard-b','Yard B','Block B','Row 01','B01',1,1,35.00,'Empty','2026-09-01 00:00:00');
UNLOCK TABLES;

LOCK TABLES `warehouse_locations` WRITE;
INSERT INTO `warehouse_locations` VALUES 
('wh-bay-02','loc-bond-wh','Aisle A','Rack 01','Shelf 01','Bond WH · Bay 2',50,75000.00,1,'occupied','2026-09-06 12:00:00'),
('wh-bay-01','loc-bond-wh','Aisle A','Rack 02','Shelf 01','Bond WH · Bay 1',50,75000.00,1,'available','2026-09-01 00:00:00'),
('wh-cold-01','loc-cold-bay','Cold Aisle','Rack 01','Shelf 01','Cold Bay · C01',20,30000.00,1,'available','2026-09-01 00:00:00');
UNLOCK TABLES;

LOCK TABLES `manifests` WRITE;
INSERT INTO `manifests` VALUES 
('man-008721','MAN-008721','TRN-BL-2026-008721','MSC Shannon','V.2408','MSC Shipping Line','Antwerp, Belgium','Lagos / Apapa','2026-09-05 14:00:00','2026-09-05',1,840,18420.00,'reconciled','682f7cf2-b05f-4c','2026-09-05 08:00:00','2026-09-05 14:30:00'),
('man-008742','MAN-008742','TRN-BL-2026-008742','CMA CGM Louga','V.1192','CMA CGM Line','Shanghai, China','Lagos / Apapa','2026-09-06 16:30:00','2026-09-06',1,450,21080.00,'arrived','682f7cf2-b05f-4c','2026-09-06 09:00:00','2026-09-06 16:45:00'),
('man-007991','MAN-007991','TRN-BL-2026-007991','Maersk Calabar','V.9021','Maersk Line','Hamburg, Germany','Lagos / Apapa','2026-09-03 11:00:00','2026-09-03',1,210,26700.00,'discharged','682f7cf2-b05f-4c','2026-09-03 08:00:00','2026-09-03 11:15:00');
UNLOCK TABLES;

LOCK TABLES `consignments` WRITE;
INSERT INTO `consignments` VALUES 
('2481','TRN-IMP-002481','man-008721','TRN-BL-2026-008721','org-atl-001',NULL,'Consumer electronics','general','MSC Shipping Line','MSC Shannon','Antwerp, Belgium','2026-09-06',7,'2026-09-06 14:00:00',NULL,'STORED','Stored',0,18420.00,NULL,NULL,NULL,'Stored in Bonded Warehouse Bay 2. Documentation clearance underway.','2026-09-05 09:00:00','2026-09-06 14:00:00'),
('2482','TRN-IMP-002482','man-008742','TRN-BL-2026-008742','org-kad-002',NULL,'Household appliances','general','CMA CGM Line','CMA CGM Louga','Shanghai, China','2026-09-07',7,'2026-09-07 10:00:00',NULL,'DOCS_IN_PROGRESS','Documentation in progress',1,21080.00,NULL,NULL,NULL,'Documentation hold placed pending Customs supporting document upload.','2026-09-06 10:00:00','2026-09-07 10:00:00'),
('1932','TRN-EXP-001932','man-007991','TRN-BL-2026-007991','org-wes-003',NULL,'Industrial components','industrial','Maersk Line','Maersk Calabar','Hamburg, Germany','2026-09-04',7,'2026-09-04 08:00:00',NULL,'HELD','On hold — contact operations',2,26700.00,NULL,NULL,NULL,'Financial hold and weight discrepancy hold active.','2026-09-03 08:30:00','2026-09-04 08:00:00'),
('2483','TRN-IMP-002483',NULL,'TRN-BL-2026-008755','org-coa-004',NULL,'Textile materials','general','Ocean Network Express','ONE Competence','Singapore','2026-09-02',7,'2026-09-02 09:00:00',NULL,'RELEASE_AUTHORISED','Released for collection',0,14920.00,'2026-09-08 11:30:00','682f7cf2-b05f-4c','REL-2026-00481','All charges settled and Customs release confirmed. Gate pass issued.','2026-09-01 10:00:00','2026-09-08 11:30:00'),
('2484','TRN-IMP-002484',NULL,'TRN-BL-2026-008781','org-prm-005',NULL,'Food-grade packaging','general','Hapag-Lloyd','Afif Express','Rotterdam','2026-09-01',7,'2026-09-01 07:00:00','2026-09-09 09:30:00','GATE_OUT','Collected',0,12640.00,'2026-09-07 14:00:00','682f7cf2-b05f-4c','REL-2026-00472','Cargo gate out completed via Gate 3 on 09 Sep 2026.','2026-08-31 09:00:00','2026-09-09 09:30:00');
UNLOCK TABLES;

LOCK TABLES `containers` WRITE;
INSERT INTO `containers` VALUES 
('cnt-2481','2481','TRIU1234564','40HC','Dry','45G1',3980.00,18420.00,'MSC-SEAL-884102','MSC-SEAL-884102','intact',NULL,'Bond WH · Bay 2',3,'STORED','In storage','2026-09-05 09:00:00','2026-09-06 14:00:00'),
('cnt-2482','2482','CMAU4829106','40FT','Dry','42G1',3800.00,21080.00,'CMA-SEAL-491028','CMA-SEAL-491028','intact','ys-b02','Yard B · B02',2,'DOCS_IN_PROGRESS','Documentation in progress','2026-09-06 10:00:00','2026-09-07 10:00:00'),
('cnt-1932','1932','MSCU1234560','40HC','Dry','45G1',4020.00,26700.00,'MSK-SEAL-901928','MSK-SEAL-901928','intact','ys-c05','Yard C · C05',5,'HELD','On hold — contact operations','2026-09-03 08:30:00','2026-09-04 08:00:00'),
('cnt-2483','2483','TEMU3849204','20FT','Dry','22G1',2240.00,14920.00,'ONE-SEAL-381920','ONE-SEAL-381920','intact','ys-a04','Yard A · A04',7,'RELEASE_AUTHORISED','Released for collection','2026-09-01 10:00:00','2026-09-08 11:30:00'),
('cnt-2484','2484','OOLU2948108','20FT','Dry','22G1',2180.00,12640.00,'HPL-SEAL-291820','HPL-SEAL-291820','intact',NULL,'Gate 3',8,'GATE_OUT','Collected','2026-08-31 09:00:00','2026-09-09 09:30:00');
UNLOCK TABLES;

LOCK TABLES `packages` WRITE;
INSERT INTO `packages` VALUES 
('pkg-01','2481','cnt-2481','SKU-ELEC-402','TRN-MK-001','Carton','Smart LED displays & controllers',480,480,0,'Carton',18420.00,45.200,'wh-bay-02','Bond WH · Bay 2','stored','2026-09-06 14:00:00','2026-09-06 14:00:00'),
('pkg-02','2482','cnt-2482','SKU-APPL-109','TRN-MK-002','Crate','Double-door smart refrigerators',140,140,0,'Crate',21080.00,58.400,NULL,'Yard B · B02','stored','2026-09-07 10:00:00','2026-09-07 10:00:00');
UNLOCK TABLES;

LOCK TABLES `cargo_events` WRITE;
INSERT INTO `cargo_events` VALUES 
('ev-01','2481','cnt-2481','manifest_received','Manifest received','Documentation desk','682f7cf2-b05f-4c','Abuja · Docs Desk','TRINU-OPS-14','MAN-008721','EXPECTED','IN_TRANSIT_TO_TERMINAL',NULL,'[]',1,'2026-09-05 09:00:00','2026-09-05 09:00:00'),
('ev-02','2481','cnt-2481','arrived_at_gate','Cargo arrived at terminal','Gate officer · I. Musa','usr-mus-003','Gate 3','Gate-03','GATE-01982','IN_TRANSIT_TO_TERMINAL','ARRIVED_AT_GATE',NULL,'[]',1,'2026-09-06 07:15:00','2026-09-06 07:15:00'),
('ev-03','2481','cnt-2481','gate_in','Gate-in completed','Yard officer · D. Okafor','usr-oka-004','Receiving Bay 2','RFID-04','GIN-002481','ARRIVED_AT_GATE','RECEIVED',NULL,'[]',1,'2026-09-06 07:45:00','2026-09-06 07:45:00'),
('ev-04','2481','cnt-2481','tally_received','Receiving completed','Warehouse team','usr-oka-004','Receiving Bay 2','Tablet-07','RCV-002481','RECEIVED','RECEIVED',NULL,'[]',1,'2026-09-06 10:30:00','2026-09-06 10:30:00'),
('ev-05','2481','cnt-2481','positioned_in_storage','Positioned in bonded storage','Yard officer · S. Eze',NULL,'Bond WH · Bay 2','RFID-11','MOV-004119','RECEIVED','STORED',NULL,'[]',1,'2026-09-07 11:20:00','2026-09-07 11:20:00'),
('ev-06','2481','cnt-2481','docs_review_started','Documentation review started','M. Adeyemi','usr-ade-002','Docs Desk','TRINU-OPS-18','DOC-009842','STORED','DOCS_IN_PROGRESS',NULL,'[]',1,'2026-09-08 14:00:00','2026-09-08 14:00:00'),
('ev-07','2481','cnt-2481','examination_scheduled','Examination scheduled','Coordination desk',NULL,'Examination Area 1','TRINU-OPS-21','EXM-001192','DOCS_IN_PROGRESS','EXAMINATION_SCHEDULED',NULL,'[]',1,'2026-09-09 10:00:00','2026-09-09 10:00:00');
UNLOCK TABLES;

LOCK TABLES `documents` WRITE;
INSERT INTO `documents` VALUES 
('doc-01','2481','cnt-2481','org-atl-001','Commercial Invoice · 008721','Commercial Invoice','DOC-INV-008721','/uploads/docs/commercial_invoice_008721.pdf',245100,'application/pdf','7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069','v2','M. Adeyemi','usr-ade-002',0,NULL,'DOC-VER-8721-A','Verified','682f7cf2-b05f-4c','2026-09-08 15:00:00',NULL,0,NULL,'2026-09-08','2026-09-08 10:00:00','2026-09-08 15:00:00'),
('doc-02','2481','cnt-2481','org-atl-001','Packing List · 008721','Packing List','DOC-PL-008721','/uploads/docs/packing_list_008721.pdf',198200,'application/pdf','e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855','v1','M. Adeyemi','usr-ade-002',0,NULL,'DOC-VER-8721-B','Under review',NULL,NULL,NULL,0,NULL,'2026-09-08','2026-09-08 10:00:00','2026-09-08 10:00:00'),
('doc-03','2481','cnt-2481','org-atl-001','Bill of Lading · 008721','Bill of Lading','TRN-BL-2026-008721','/uploads/docs/bl_008721.pdf',320400,'application/pdf','c157a79031e1c40f85931829bc5fc552add14b1464fb795ce3be8383e2975b11','v1','Shipping desk',NULL,0,NULL,'DOC-VER-8721-C','Verified','682f7cf2-b05f-4c','2026-09-06 16:00:00',NULL,0,NULL,'2026-09-06','2026-09-06 12:00:00','2026-09-06 16:00:00'),
('doc-04','2482','cnt-2482','org-kad-002','Customs support documents','Customs Release Document','DOC-CUS-008742',NULL,NULL,NULL,NULL,'v1','—',NULL,0,NULL,'DOC-VER-8742-REQ','Required',NULL,NULL,NULL,0,NULL,NULL,'2026-09-07 10:00:00','2026-09-07 10:00:00'),
('doc-05','2481','cnt-2481','org-atl-001','Delivery Order · 008721','Delivery Order','DOC-DO-008721','/uploads/docs/delivery_order_008721.pdf',210900,'application/pdf','9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08','v1','Meridian Customs Services',NULL,0,NULL,'DOC-VER-8721-DO','Uploaded',NULL,NULL,NULL,0,NULL,'2026-09-09','2026-09-09 09:00:00','2026-09-09 09:00:00');
UNLOCK TABLES;

LOCK TABLES `invoices` WRITE;
INSERT INTO `invoices` VALUES 
('inv-01','TRN-INV-2026-01482','final','Full terminal charge','2481','org-atl-001','Atlantic Trade Nigeria Ltd','TRN-BL-2026-008721','TRIU1234564',1160930.23,87069.77,0.00,1248000.00,0.00,1248000.00,'NGN','2026-09-09','2026-09-16','Issued','682f7cf2-b05f-4c',7,'Consignment handling, storage, inspection assistance and security levy.','2026-09-09 08:30:00','2026-09-09 08:30:00'),
('inv-02','TRN-INV-2026-01475','final','Handling','2482','org-kad-002','Kaduna Import & Distribution Ltd','TRN-BL-2026-008742','CMAU4829106',776279.07,58220.93,0.00,834500.00,834500.00,0.00,'NGN','2026-09-08','2026-09-15','Paid','682f7cf2-b05f-4c',7,'Terminal handling charge paid in full via NIBSS transfer.','2026-09-08 10:00:00','2026-09-08 14:20:00'),
('inv-03','TRN-INV-2026-01461','final','Storage escalation','1932','org-wes-003','Westbridge Logistics','TRN-BL-2026-007991','MSCU1234560',2241860.47,168139.53,0.00,2410000.00,0.00,2410000.00,'NGN','2026-09-05','2026-09-12','Overdue','682f7cf2-b05f-4c',7,'Storage escalation and heavy lift fees past due date. Dunning Stage 2 active.','2026-09-05 11:00:00','2026-09-13 00:00:00'),
('inv-04','TRN-INV-2026-01440','final','Handling','2483','org-coa-004','Coastal Freight Nigeria','TRN-BL-2026-008755','TEMU3849204',364651.16,27348.84,0.00,392000.00,392000.00,0.00,'NGN','2026-09-02','2026-09-09','Paid','682f7cf2-b05f-4c',7,'Full clearance payment confirmed. Gate pass issued.','2026-09-02 14:00:00','2026-09-03 09:30:00');
UNLOCK TABLES;

LOCK TABLES `gate_appointments` WRITE;
INSERT INTO `gate_appointments` VALUES 
('bkg-01','BKG-2026-00481',NULL,'07:42','2481','cnt-2481','TRIU1234564','TRN-IMP-002481',NULL,'Atlantic Logistics Transport',NULL,'ABJ-482-KD',NULL,'A. Balogun','+2348039182019','collection',1,1,1,'Admitted','2026-09-09 07:00:00','2026-09-09 07:42:00'),
('bkg-02','BKG-2026-00482',NULL,'07:55','2482','cnt-2482','CMAU4829106','TRN-IMP-002482',NULL,'Kaduna Freight Services',NULL,'KJA-918-LA',NULL,'S. Okoro','+2348028192049','collection',1,1,1,'Loading','2026-09-09 07:15:00','2026-09-09 07:55:00'),
('bkg-03','BKG-2026-00483',NULL,'08:10','1932','cnt-1932','MSCU1234560','TRN-EXP-001932',NULL,'Westbridge Haulage',NULL,'KAN-302-XY',NULL,'M. Yusuf','+2348057281920','collection',0,0,0,'Referred','2026-09-09 07:30:00','2026-09-09 08:10:00'),
('bkg-04','BKG-2026-00484',NULL,'08:18','2483','cnt-2483','TEMU3849204','TRN-IMP-002483',NULL,'Coastal Haulers',NULL,'KJA-918-LA',NULL,'E. Eze','+2348071829401','collection',1,1,1,'Queued','2026-09-09 07:45:00','2026-09-09 08:18:00'),
('bkg-05','BKG-2026-00485',NULL,'08:30','2484','cnt-2484','OOLU2948108','TRN-IMP-002484',NULL,'Prime Haulage Ltd',NULL,'ABJ-482-KD',NULL,'R. Bello','+2348092819402','collection',1,1,1,'Confirmed','2026-09-09 08:00:00','2026-09-09 08:30:00');
UNLOCK TABLES;

LOCK TABLES `gate_passes` WRITE;
INSERT INTO `gate_passes` VALUES 
('gp-01','GP-2026-00481','bkg-01','ABJ-482-KD','A. Balogun','TRIU1234564','Collection','hash-gp-481','GP-481','2026-09-09 06:00:00','2026-09-09 18:00:00','2026-09-09 07:00:00','usr-mus-003','Admitted',NULL,'2026-09-09 07:00:00'),
('gp-02','GP-2026-00483','bkg-04','KJA-918-LA','E. Eze','TEMU3849204','Terminal Entry','hash-gp-483','GP-483','2026-09-09 07:00:00','2026-09-09 19:00:00','2026-09-09 07:30:00','usr-mus-003','Active',NULL,'2026-09-09 07:30:00');
UNLOCK TABLES;

LOCK TABLES `notifications` WRITE;
INSERT INTO `notifications` VALUES 
('notif-01',NULL,'org-kad-002','Document awaiting upload','TRN-IMP-002482 · Customs support documents','Documents','warning','in_app','/portal/documents','unread',NULL,'2026-09-09 08:52:00'),
('notif-02',NULL,'org-atl-001','Examination scheduled','TRN-IMP-002481 · 09 Sep 2026 at 14:30','Examination','info','in_app','/portal/cargo/2481','unread',NULL,'2026-09-09 08:36:00'),
('notif-03',NULL,'org-wes-003','Financial hold applied','TRN-EXP-001932 · outstanding charges','Holds','critical','in_app','/portal/invoices','unread',NULL,'2026-09-09 08:00:00'),
('notif-04',NULL,'org-coa-004','Gate pass generated','TRN-IMP-002483 · GP-2026-00481','Gate','success','in_app','/portal/bookings','unread',NULL,'2026-09-09 07:00:00');
UNLOCK TABLES;

LOCK TABLES `tariffs` WRITE;
INSERT INTO `tariffs` VALUES 
('trf-01','TRF-HND-01','Terminal Handling Charge (Inbound)','Handling','Per container',75000.00,120000.00,75000.00,'NGN',0,'2026-01-01',NULL,1,'2026-01-01 00:00:00'),
('trf-02','TRF-STR-01','Bonded Yard Storage (Days 1–7 Free, Days 8–14)','Storage','Per TEU/day',8500.00,16000.00,8500.00,'NGN',7,'2026-01-01',NULL,1,'2026-01-01 00:00:00'),
('trf-03','TRF-STR-02','Storage Escalation (Days 15–28)','Storage','Per TEU/day',15000.00,28000.00,15000.00,'NGN',0,'2026-01-01',NULL,1,'2026-01-01 00:00:00'),
('trf-04','TRF-STR-03','Overstay Storage Rate (Days 29+)','Storage','Per TEU/day',25000.00,48000.00,25000.00,'NGN',0,'2026-01-01',NULL,1,'2026-01-01 00:00:00'),
('trf-05','TRF-EXM-01','Customs Examination Area Positioning & Assistance','Handling','Per container',45000.00,70000.00,45000.00,'NGN',0,'2026-01-01',NULL,1,'2026-01-01 00:00:00'),
('trf-06','TRF-WGH-01','Certified Weighbridge Weight Ticket','Specialized','Per weighment',12000.00,12000.00,12000.00,'NGN',0,'2026-01-01',NULL,1,'2026-01-01 00:00:00');
UNLOCK TABLES;

LOCK TABLES `tax_rules` WRITE;
INSERT INTO `tax_rules` VALUES 
('tax-01','VAT-075','Value Added Tax (VAT 7.5%)','Percentage',7.5000,'All Services',0,'2020-02-01',NULL,1,'2026-01-01 00:00:00'),
('tax-02','PORT-DEV-01','Port Modernisation & Regulatory Surcharge','Percentage',1.0000,'Handling only',0,'2026-01-01',NULL,1,'2026-01-01 00:00:00'),
('tax-03','WHT-050','Withholding Tax (Applicable Corporate Services)','Percentage',5.0000,'Invoices',1,'2020-01-01',NULL,1,'2026-01-01 00:00:00');
UNLOCK TABLES;

LOCK TABLES `system_audit_logs` WRITE;
INSERT INTO `system_audit_logs` VALUES 
('aud-01','2026-09-09 08:35:32','Mathias (System Admin)','682f7cf2-b05f-4c','Authentication success with MFA','User / 682f7cf2-b05f-4c','User','682f7cf2-b05f-4c',NULL,'{"mfa":"verified"}','::1','Mozilla/5.0','Success','e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855','2026-09-09 08:35:32'),
('aud-02','2026-09-09 07:42:00','I. Musa (Gate Officer)','usr-mus-003','Gate admission authorized','GatePass / GP-2026-00481','GatePass','gp-01',NULL,'{"lane":"Lane 2"}','192.168.1.102','Gate Kiosk 02','Success','9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08','2026-09-09 07:42:00'),
('aud-03','2026-09-08 16:20:00','M. Adeyemi','usr-ade-002','Commercial invoice v2 uploaded','Document / DOC-INV-008721','Document','doc-01',NULL,'{"version":"v2"}','197.210.65.12','Chrome Desktop','Success','c157a79031e1c40f85931829bc5fc552add14b1464fb795ce3be8383e2975b11','2026-09-08 16:20:00');
UNLOCK TABLES;

LOCK TABLES `system_configurations` WRITE;
INSERT INTO `system_configurations` VALUES 
('cfg-01','terminal_free_storage_days','7','number','storage_rules','Number of free storage days allowed before demurrage/storage fees accrue.',1,'682f7cf2-b05f-4c','2026-09-01 00:00:00'),
('cfg-02','vbs_slot_lead_time_hours','2','number','vbs_rules','Minimum advance booking hours required before gate arrival appointment.',1,'682f7cf2-b05f-4c','2026-09-01 00:00:00'),
('cfg-03','mfa_mandatory_roles','["system_admin","finance","management","gate_officer"]','json','security','Roles requiring mandatory two-factor authentication.',0,'682f7cf2-b05f-4c','2026-09-01 00:00:00'),
('cfg-04','currency_code','NGN','string','general','Default operational currency code.',1,'682f7cf2-b05f-4c','2026-09-01 00:00:00'),
('cfg-05','currency_symbol','₦','string','general','Default currency symbol.',1,'682f7cf2-b05f-4c','2026-09-01 00:00:00'),
('cfg-06','support_email','support@trinuterminal.com','string','general','Primary public customer support email address.',1,'682f7cf2-b05f-4c','2026-09-01 00:00:00');
UNLOCK TABLES;

LOCK TABLES `feature_flags` WRITE;
INSERT INTO `feature_flags` VALUES 
('ff-01','anpr_automated_gate_trigger','Automated ANPR Barrier Trigger',1,'Controls automatic gate barrier raise upon successful ANPR plate and pass match.',100,'["system_admin","gate_officer"]','682f7cf2-b05f-4c','2026-09-01 00:00:00'),
('ff-02','customs_bodogwu_live_sync','Customs B''Odogwu Live API Sync',0,'Real-time webhook and EDI sync with NCS B''Odogwu customs declaration engine.',0,'["system_admin","compliance_customs_liaison"]','682f7cf2-b05f-4c','2026-09-01 00:00:00'),
('ff-03','public_tracking_sms_fallback','Public Cargo Tracking SMS Notification Fallback',1,'Enables automated SMS notification fallback for cargo status state changes.',100,'[]','682f7cf2-b05f-4c','2026-09-01 00:00:00');
UNLOCK TABLES;

LOCK TABLES `faqs` WRITE;
INSERT INTO `faqs` VALUES 
('faq-01','How do I track my container or consignment?','Enter your Container Number (e.g. TRIU1234564), Bill of Lading Number, or TRINU Terminal Reference into our Public Cargo Tracking portal. You will receive live verified status updates without needing an account.','Tracking & Status',1,1,'2026-09-01 00:00:00'),
('faq-02','What documents are required for cargo release at TRINU?','Required documents include the Original or Endorsed Bill of Lading, Valid Delivery Order (DO) from the shipping line, Customs Single Goods Declaration (SGD) with duty payment confirmation, Final Customs Release Document, and Valid TRINU Gate Pass.','Documentation & Customs',2,1,'2026-09-01 00:00:00'),
('faq-03','How many free storage days are permitted before demurrage begins?','TRINU Bonded Warehouse grants 7 standard free storage days starting from the date container discharge and positioning in our bonded facility is completed.','Storage & Dwell Time',3,1,'2026-09-01 00:00:00'),
('faq-04','Can my clearing agent access documents on my behalf?','Yes. Importers can easily grant secure, time-bound delegated authority to registered licensed Customs agents through the Stakeholder Portal. Delegations can be revoked instantly at any time.','Documentation & Customs',4,1,'2026-09-01 00:00:00'),
('faq-05','How does the Vehicle Booking System (VBS) work for collection?','Hauliers and transporters must book a 2-hour appointment window through the portal after release clearance is confirmed. Once booked, a digital Gate Pass with a secure QR code is issued to the driver.','Gate & VBS Appointments',5,1,'2026-09-01 00:00:00');
UNLOCK TABLES;

LOCK TABLES `articles_and_notices` WRITE;
INSERT INTO `articles_and_notices` VALUES 
('art-01','TRINU Terminal Launches Next-Generation Digital Operating Core','trinu-terminal-launches-next-gen-digital-operating-core','Technology','TRINU Bonded Warehouse inaugurates its client portal and digital terminal operating system to streamline northern corridor logistics.','<p>TRINU Bonded Warehouse has officially deployed its state-of-the-art Terminal Operating Core (TOC) and integrated Stakeholder Portal. The system provides real-time visibility from vessel discharge to final gate collection, eliminating manual paper bottlenecks.</p>','/news/digital-core-launch.jpg','TRINU Editorial Desk',1,'2026-09-01 09:00:00',1,4,'["Logistics","Technology","Customs"]','682f7cf2-b05f-4c','2026-09-01 09:00:00','2026-09-01 09:00:00'),
('art-02','New Vehicle Booking System (VBS) Mandatory for Inbound & Outbound Haulage','new-vbs-mandatory-for-haulage','Notices','All haulage operators and truck drivers must now possess a confirmed VBS digital slot prior to terminal gate presentation.','<p>To reduce truck dwell times and prevent congestion around the industrial terminal zone, TRINU has implemented a mandatory Vehicle Booking System. Trucks with active gate passes enjoy fast-track Lane 2 admission.</p>','/news/vbs-announcement.jpg','Operations Directorate',1,'2026-09-05 10:00:00',1,3,'["VBS","Gate","Trucks"]','682f7cf2-b05f-4c','2026-09-05 10:00:00','2026-09-05 10:00:00');
UNLOCK TABLES;


ALTER TABLE users
ADD COLUMN mfa_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER phone_verified_at,
ADD COLUMN mfa_secret TEXT DEFAULT NULL AFTER mfa_enabled;

CREATE TABLE mfa_recovery_codes (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    used_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_mfa_recovery_user (user_id),
    KEY idx_mfa_recovery_used (user_id, used_at),
    CONSTRAINT fk_mfa_recovery_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE otp_codes
ADD COLUMN mfa_token_hash VARCHAR(255) NULL AFTER otp_hash;

ALTER TABLE `users` ADD `pics` VARCHAR(200) NOT NULL DEFAULT 'avatar.png' AFTER `phone`;

CREATE TABLE `registration_documents` (
  `id` char(36) NOT NULL,
  `registration_request_id` char(36) NOT NULL,
  `document_type` enum('cac','tin','signatory_id','licence') NOT NULL,
  `licence_type` varchar(80) DEFAULT NULL,
  `licence_reference` varchar(150) DEFAULT NULL,
  `file_path` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_size` bigint unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_registration_document_request` (`registration_request_id`),
  KEY `idx_registration_document_type` (`document_type`),
  KEY `idx_registration_document_licence` (`licence_type`),
  CONSTRAINT `fk_registration_document_request`
    FOREIGN KEY (`registration_request_id`)
    REFERENCES `registration_requests` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE organisation_document_reviews (
    id char(36) NOT NULL,
    registration_document_id char(36) NOT NULL,
    organisation_id char(36) NOT NULL,
    status enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
    rejection_reason text DEFAULT NULL,
    reviewed_by char(36) DEFAULT NULL,
    reviewed_at datetime DEFAULT NULL,
    created_at timestamp NOT NULL DEFAULT current_timestamp(),
    updated_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
    PRIMARY KEY (id),
    UNIQUE KEY uq_document_review (registration_document_id),
    KEY idx_document_review_org (organisation_id),
    KEY idx_document_review_status (status),
    KEY idx_document_review_reviewer (reviewed_by),
    CONSTRAINT fk_document_review_document
        FOREIGN KEY (registration_document_id)
        REFERENCES registration_documents(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_document_review_org
        FOREIGN KEY (organisation_id)
        REFERENCES organisations(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_document_review_user
        FOREIGN KEY (reviewed_by)
        REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_invitations (
    id char(36) NOT NULL,
    user_id char(36) NOT NULL,
    token_hash varchar(255) NOT NULL,
    expires_at datetime NOT NULL,
    accepted_at datetime DEFAULT NULL,
    revoked_at datetime DEFAULT NULL,
    invited_by char(36) DEFAULT NULL,
    created_at timestamp NOT NULL DEFAULT current_timestamp(),
    PRIMARY KEY (id),
    UNIQUE KEY uq_invitation_token (token_hash),
    KEY idx_invitation_user (user_id),
    KEY idx_invitation_expiry (expires_at),
    KEY idx_invitation_invited_by (invited_by),
    CONSTRAINT fk_invitation_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_invitation_invited_by
        FOREIGN KEY (invited_by) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE otp_codes
MODIFY purpose ENUM('login_mfa', 'password_reset', 'phone_verify', 'email_verify', 'regulator_access') NOT NULL;

ALTER TABLE organisations
ADD COLUMN date_of_incorporation date DEFAULT NULL AFTER tin,
ADD COLUMN sector varchar(150) DEFAULT NULL AFTER date_of_incorporation,
ADD COLUMN registered_address text DEFAULT NULL AFTER sector,
ADD COLUMN website varchar(255) DEFAULT NULL AFTER registered_address;

ALTER TABLE registration_requests
ADD COLUMN date_of_incorporation date DEFAULT NULL AFTER tin,
ADD COLUMN sector varchar(150) DEFAULT NULL AFTER date_of_incorporation,
ADD COLUMN registered_address text DEFAULT NULL AFTER sector,
ADD COLUMN website varchar(255) DEFAULT NULL AFTER registered_address;

ALTER TABLE registration_requests
    DROP COLUMN account_type,
    DROP COLUMN full_name,
    DROP COLUMN phone,
    DROP COLUMN password_hash,
    DROP COLUMN organisation_name,
    DROP COLUMN rc_number,
    DROP COLUMN tin,
    DROP COLUMN job_title,
    DROP COLUMN terms_accepted,
    DROP COLUMN privacy_accepted,
    DROP COLUMN terms_version,
    DROP COLUMN privacy_version,
    DROP COLUMN ip_address,
    DROP COLUMN user_agent;