-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: trinu
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account_events`
--

DROP TABLE IF EXISTS `account_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_events`
--

LOCK TABLES `account_events` WRITE;
/*!40000 ALTER TABLE `account_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `account_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `login_attempts`
--

DROP TABLE IF EXISTS `login_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `login_attempts`
--

LOCK TABLES `login_attempts` WRITE;
/*!40000 ALTER TABLE `login_attempts` DISABLE KEYS */;
INSERT INTO `login_attempts` VALUES ('c9ffd8e1-b7d0-48','hqfdevelopers@gmail.com','682f7cf2-b05f-4c','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','success','Password and MFA verified','2026-09-29 17:35:32');
/*!40000 ALTER TABLE `login_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organisation_members`
--

DROP TABLE IF EXISTS `organisation_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organisation_members`
--

LOCK TABLES `organisation_members` WRITE;
/*!40000 ALTER TABLE `organisation_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `organisation_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organisations`
--

DROP TABLE IF EXISTS `organisations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organisations`
--

LOCK TABLES `organisations` WRITE;
/*!40000 ALTER TABLE `organisations` DISABLE KEYS */;
INSERT INTO `organisations` VALUES ('d2beefba-e4bc-4d','TRINU BONDED WAREHOUSE','RC-2555656565','61561651615','terminal','verified',NULL,NULL,NULL,'2026-09-29 13:56:20','2026-09-29 19:00:42');
/*!40000 ALTER TABLE `organisations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_codes`
--

DROP TABLE IF EXISTS `otp_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_codes`
--

LOCK TABLES `otp_codes` WRITE;
/*!40000 ALTER TABLE `otp_codes` DISABLE KEYS */;
INSERT INTO `otp_codes` VALUES ('4b1243da-ba18-4b','682f7cf2-b05f-4c','$2y$10$/F8waWdFIZkDaySUprDLaeRxw7gyMPArx1pIStGc3sjQzBPImIeSi','email','hqfdevelopers@gmail.com','login_mfa',0,5,1,'2026-09-29 18:35:10','2026-09-29 18:40:10','2026-09-29 18:35:32',NULL,'::1','2026-09-29 17:35:10');
/*!40000 ALTER TABLE `otp_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES ('1838d8fb-bc37-11f1-bb55-5081407ad051','portal.view','portal','view','Access the stakeholder portal.','2026-09-29 18:53:45'),('1838defc-bc37-11f1-bb55-5081407ad051','portal.cargo','portal','cargo','View authorised cargo information.','2026-09-29 18:53:45'),('1838df69-bc37-11f1-bb55-5081407ad051','portal.documents','portal','documents','Access authorised documents.','2026-09-29 18:53:45'),('1838dfa3-bc37-11f1-bb55-5081407ad051','portal.financials','portal','financials','View authorised financial information.','2026-09-29 18:53:45'),('1838dfdd-bc37-11f1-bb55-5081407ad051','portal.requests','portal','requests','Create and manage authorised service requests.','2026-09-29 18:53:45'),('1838e013-bc37-11f1-bb55-5081407ad051','operations.view','operations','view','View terminal operations.','2026-09-29 18:53:45'),('1838e040-bc37-11f1-bb55-5081407ad051','operations.manage','operations','manage','Manage terminal operational workflows.','2026-09-29 18:53:45'),('1838e071-bc37-11f1-bb55-5081407ad051','operations.cargo','operations','cargo','Manage cargo receiving, movements and status workflows.','2026-09-29 18:53:45'),('1838e0a9-bc37-11f1-bb55-5081407ad051','operations.holds','operations','holds','Manage authorised holds and hold-related workflows.','2026-09-29 18:53:45'),('1838e0dd-bc37-11f1-bb55-5081407ad051','operations.examination','operations','examination','Manage examination scheduling and evidence capture without making Customs decisions.','2026-09-29 18:53:45'),('1838e115-bc37-11f1-bb55-5081407ad051','gate.view','gate','view','View gate operations and bookings.','2026-09-29 18:53:45'),('1838e144-bc37-11f1-bb55-5081407ad051','gate.bookings','gate','bookings','Manage vehicle and gate bookings.','2026-09-29 18:53:45'),('1838e174-bc37-11f1-bb55-5081407ad051','gate.admit','gate','admit','Perform authorised gate admission decisions.','2026-09-29 18:53:45'),('1838e1a4-bc37-11f1-bb55-5081407ad051','gate.refer','gate','refer','Refer gate movements with reasons.','2026-09-29 18:53:45'),('1838e1d8-bc37-11f1-bb55-5081407ad051','gate.reject','gate','reject','Reject gate movements with reasons.','2026-09-29 18:53:45'),('1838e20a-bc37-11f1-bb55-5081407ad051','gate.override','gate','override','Perform supervisor-authorised gate overrides.','2026-09-29 18:53:45'),('1838e23e-bc37-11f1-bb55-5081407ad051','gate.gate_out','gate','gate_out','Perform gate-out and release checks within assigned authority.','2026-09-29 18:53:45'),('1838e270-bc37-11f1-bb55-5081407ad051','warehouse.view','warehouse','view','View warehouse and yard information.','2026-09-29 18:53:45'),('1838e2a1-bc37-11f1-bb55-5081407ad051','warehouse.receive','warehouse','receive','Receive and tally cargo.','2026-09-29 18:53:45'),('1838e2d6-bc37-11f1-bb55-5081407ad051','warehouse.inventory','warehouse','inventory','Manage inventory counts and approved adjustments.','2026-09-29 18:53:45'),('1838e30e-bc37-11f1-bb55-5081407ad051','warehouse.position','warehouse','position','Position and relocate cargo.','2026-09-29 18:53:45'),('1838e347-bc37-11f1-bb55-5081407ad051','warehouse.pick','warehouse','pick','Pick cargo for authorised workflows.','2026-09-29 18:53:45'),('1838e37c-bc37-11f1-bb55-5081407ad051','documents.view','documents','view','View authorised documents.','2026-09-29 18:53:45'),('1838e3af-bc37-11f1-bb55-5081407ad051','documents.manage','documents','manage','Register and manage documents.','2026-09-29 18:53:45'),('1838e3e0-bc37-11f1-bb55-5081407ad051','documents.verify','documents','verify','Verify documents.','2026-09-29 18:53:45'),('1838e414-bc37-11f1-bb55-5081407ad051','documents.issue','documents','issue','Issue authorised terminal documents.','2026-09-29 18:53:45'),('1838e445-bc37-11f1-bb55-5081407ad051','finance.view','finance','view','View financial information.','2026-09-29 18:53:45'),('1838e477-bc37-11f1-bb55-5081407ad051','finance.tariffs','finance','tariffs','Manage tariffs and charging rules within authority.','2026-09-29 18:53:45'),('1838e4a9-bc37-11f1-bb55-5081407ad051','finance.invoices','finance','invoices','Manage invoices, credit notes and receipts within authority.','2026-09-29 18:53:45'),('1838e4db-bc37-11f1-bb55-5081407ad051','finance.payments','finance','payments','Manage payment records and payment confirmation workflows.','2026-09-29 18:53:45'),('1838e50a-bc37-11f1-bb55-5081407ad051','finance.reconciliation','finance','reconciliation','Perform payment and bank reconciliation.','2026-09-29 18:53:45'),('1838e53a-bc37-11f1-bb55-5081407ad051','finance.collections','finance','collections','Manage collections, ageing and dunning workflows.','2026-09-29 18:53:45'),('1838e56b-bc37-11f1-bb55-5081407ad051','finance.adjustments','finance','adjustments','Manage authorised financial adjustments, discounts and waivers.','2026-09-29 18:53:45'),('1838e59a-bc37-11f1-bb55-5081407ad051','reports.view','reports','view','View role-scoped reports.','2026-09-29 18:53:45'),('1838e5c9-bc37-11f1-bb55-5081407ad051','reports.export','reports','export','Export role-scoped reports.','2026-09-29 18:53:45'),('1838e5fa-bc37-11f1-bb55-5081407ad051','reports.management','reports','management','Access management reporting and analytics.','2026-09-29 18:53:45'),('1838e62d-bc37-11f1-bb55-5081407ad051','customer_service.view','customer_service','view','View customer service and sales records.','2026-09-29 18:53:45'),('1838e65c-bc37-11f1-bb55-5081407ad051','customer_service.manage','customer_service','manage','Manage customer service workflows.','2026-09-29 18:53:45'),('1838e68d-bc37-11f1-bb55-5081407ad051','customer_service.quotes','customer_service','quotes','Manage enquiries and quotations.','2026-09-29 18:53:45'),('1838e6c1-bc37-11f1-bb55-5081407ad051','customer_service.onboarding','customer_service','onboarding','Manage KYC and onboarding workflows.','2026-09-29 18:53:45'),('1838e6fa-bc37-11f1-bb55-5081407ad051','compliance.view','compliance','view','View compliance and Customs liaison records.','2026-09-29 18:53:45'),('1838e72a-bc37-11f1-bb55-5081407ad051','compliance.manage','compliance','manage','Manage compliance workflows and authorised Customs references.','2026-09-29 18:53:45'),('1838e75b-bc37-11f1-bb55-5081407ad051','compliance.audit','compliance','audit','Prepare authorised audit and compliance responses.','2026-09-29 18:53:45'),('1838e78b-bc37-11f1-bb55-5081407ad051','management.dashboard','management','dashboard','Access management dashboards.','2026-09-29 18:53:45'),('1838e7d5-bc37-11f1-bb55-5081407ad051','management.reports','management','reports','Access management reports and analytics.','2026-09-29 18:53:45'),('1838e809-bc37-11f1-bb55-5081407ad051','administration.users','administration','users','Manage users and memberships.','2026-09-29 18:53:45'),('1838e83b-bc37-11f1-bb55-5081407ad051','administration.roles','administration','roles','Manage roles.','2026-09-29 18:53:45'),('1838e86a-bc37-11f1-bb55-5081407ad051','administration.permissions','administration','permissions','Manage permissions and role assignments.','2026-09-29 18:53:45'),('1838e89f-bc37-11f1-bb55-5081407ad051','administration.configuration','administration','configuration','Manage designated business configuration.','2026-09-29 18:53:45'),('1838e8d6-bc37-11f1-bb55-5081407ad051','administration.audit','administration','audit','View and export audit records.','2026-09-29 18:53:45'),('1838e909-bc37-11f1-bb55-5081407ad051','administration.feature_flags','administration','feature_flags','Manage feature flags and maintenance controls.','2026-09-29 18:53:45'),('1838e93f-bc37-11f1-bb55-5081407ad051','administration.integrations','administration','integrations','Manage integration configuration and operational controls.','2026-09-29 18:53:45'),('1838e977-bc37-11f1-bb55-5081407ad051','system.organisations','system','organisations','Manage and view all organisations.','2026-09-29 18:53:45'),('1838e9a8-bc37-11f1-bb55-5081407ad051','system.users','system','users','Manage users across the platform.','2026-09-29 18:53:45'),('1838e9dc-bc37-11f1-bb55-5081407ad051','system.roles','system','roles','Manage platform roles and permissions.','2026-09-29 18:53:45'),('1838ea93-bc37-11f1-bb55-5081407ad051','system.audit','system','audit','View platform-wide audit information.','2026-09-29 18:53:45'),('1838ead1-bc37-11f1-bb55-5081407ad051','system.configuration','system','configuration','Manage platform-wide configuration.','2026-09-29 18:53:45');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registration_otps`
--

DROP TABLE IF EXISTS `registration_otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registration_otps`
--

LOCK TABLES `registration_otps` WRITE;
/*!40000 ALTER TABLE `registration_otps` DISABLE KEYS */;
INSERT INTO `registration_otps` VALUES ('bcbb8403-b1d0-47','a5abe645-d228-4f','email','hqfdevelopers@gmail.com','$2y$10$SEfXGJLeG/4rmVCL2kBv8.Rhuo38/HpS/5rITnXfFcB6wqDrcr.kK','registration_email',0,5,0,'2026-09-29 14:55:35','2026-09-29 15:00:35','2026-09-29 14:56:17',NULL,'2026-09-29 13:55:35');
/*!40000 ALTER TABLE `registration_otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registration_requests`
--

DROP TABLE IF EXISTS `registration_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registration_requests`
--

LOCK TABLES `registration_requests` WRITE;
/*!40000 ALTER TABLE `registration_requests` DISABLE KEYS */;
INSERT INTO `registration_requests` VALUES ('a5abe645-d228-4f','49f75b78-b5c9-4d9d-9d1a-ea3b8847dff1','importer','Mathias','hqfdevelopers@gmail.com','+2348164902529','$2y$10$T/EwX7MAZLm.S7MkDiYHveorvUIBR3m.zfrkuuKFn6kQ5PiGmgM62','Antlatic Electronics trades','RC-2555656565','61561651615','Manager','completed','2026-09-29 14:56:17',NULL,1,1,'1.0','1.0','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-29 15:25:35','682f7cf2-b05f-4c','2026-09-29 13:55:35','2026-09-29 13:56:20');
/*!40000 ALTER TABLE `registration_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_permissions` (
  `role_id` char(36) NOT NULL,
  `permission_id` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `idx_role_permission_permission` (`permission_id`),
  CONSTRAINT `fk_role_permission_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permission_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES ('18386d94-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e5fa-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e62d-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e65c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e68d-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e6c1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e6fa-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e72a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e75b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e78b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e7d5-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e809-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e83b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e86a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e89f-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e8d6-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e909-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e93f-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e977-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e9a8-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e9dc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838ea93-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838ead1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e5fa-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e62d-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e65c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e68d-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e6c1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e6fa-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e72a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e75b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e78b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e7d5-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e809-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e83b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e86a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e89f-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e8d6-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e909-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e93f-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e5fa-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e78b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e7d5-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e62d-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e65c-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e68d-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e6c1-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e6fa-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e72a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e75b-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 18:53:45');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES ('18386d94-bc37-11f1-bb55-5081407ad051','system_admin','System Administrator','system','Platform-wide administration across all organisations.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','organisation_owner','Organisation Owner','organisation','Full access to the organisation and its operational functions.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','management','Management','organisation','Management dashboards, reports and authorised operational and financial visibility.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','finance','Finance','organisation','Tariffs, invoices, payments, collections and reconciliation.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','terminal_operations','Terminal Operations','organisation','Cargo receiving, movements, holds, exceptions and operational workflows.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','gate_officer','Gate Officer','organisation','Gate bookings, gate decisions, gate-in and gate-out operations.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','warehouse_yard_officer','Warehouse / Yard Officer','organisation','Warehouse, yard, inventory, positioning, picking and relocation operations.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','documentation_officer','Documentation Officer','organisation','Document registration, verification and issuance.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','customer_service_sales','Customer Service / Sales','organisation','Enquiries, quotations, onboarding and customer service workflows.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','compliance_customs_liaison','Compliance / Customs Liaison','organisation','Compliance workflows, Customs liaison and audit response.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','regulator_auditor','Regulator / Auditor','organisation','Scoped read-only access to authorised records.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','portal_user','Portal User','organisation','Basic authorised stakeholder portal access.',1,'2026-09-29 18:53:45','2026-09-29 18:53:45');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('efbc35a2-dd8f-43','682f7cf2-b05f-4c','568d88207f1afe7b1d9d88cf24c4a8ea88e3feb3e9dd1a661c1d6e31e0761dd4',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-09-29 18:35:32','2026-10-29 18:35:32',NULL,NULL,'2026-09-29 17:35:32');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trusted_devices`
--

DROP TABLE IF EXISTS `trusted_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trusted_devices`
--

LOCK TABLES `trusted_devices` WRITE;
/*!40000 ALTER TABLE `trusted_devices` DISABLE KEYS */;
/*!40000 ALTER TABLE `trusted_devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('682f7cf2-b05f-4c',NULL,'system','18386d94-bc37-11f1-bb55-5081407ad051','Mathias','hqfdevelopers@gmail.com','+2348164902529','$2y$10$T/EwX7MAZLm.S7MkDiYHveorvUIBR3m.zfrkuuKFn6kQ5PiGmgM62','2026-09-29 14:56:17',NULL,'active',0,NULL,'2026-09-29 18:35:32','2026-09-29 14:56:20','2026-09-29 13:56:20','2026-09-29 18:53:45');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-29 20:08:08
