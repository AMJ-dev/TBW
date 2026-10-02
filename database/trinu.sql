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
INSERT INTO `account_events` VALUES ('110235f9-c456-4d8f-b76b-6c77e4c5c1a1','ff20dfcf-f843-4cd3-a263-412210683de9','phone_verified','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','{\"message\":\"Phone number verified during registration.\",\"registration_ref\":\"7c95dd36-011d-4668-9de9-c378ec26270e\"}','2026-10-01 14:33:18'),('1c9eac8d-e3ae-4c49-aeb3-14bf21fb2482','ff20dfcf-f843-4cd3-a263-412210683de9','email_verified','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','{\"message\":\"Email verified during registration.\",\"registration_ref\":\"7c95dd36-011d-4668-9de9-c378ec26270e\"}','2026-10-01 14:33:18');
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
INSERT INTO `login_attempts` VALUES ('010ce483-e487-4a50-abee-e10f2535976e','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','invalid_password','Account status: pending_approval','2026-10-01 16:49:01'),('0b147a5e-457a-4099-9898-53fababc99e1','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 18:27:38'),('0fe5e6e5-e192-4b6d-b88d-64e6324e3eea','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 19:21:46'),('10766f14-2dc3-4cf5-b4f1-5ca1e556c99d','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','success','Password and MFA verified','2026-10-01 17:00:50'),('14a5260c-982e-4394-bb36-e06786021b6f','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, authenticator MFA required','2026-09-30 19:48:28'),('1ddb8d5c-01cc-4737-b89d-387a7bb345db','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_failed','Invalid MFA verification code','2026-09-30 19:38:48'),('2d65059c-2f32-4e9b-864f-9f7a97321a15','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 19:20:14'),('3815349f-ea59-4436-af63-790d2d480ae3','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','mfa_pending','Password verified, email OTP required','2026-10-01 17:19:46'),('5010a717-4873-4d73-8266-61d7aa44d6e5','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_failed','Invalid authenticator MFA code','2026-09-30 19:49:06'),('57aaaadf-b3c5-43f5-bfcb-8e3668762fea','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, authenticator MFA required','2026-10-02 14:39:45'),('582f3189-4cf9-468a-91eb-7ed591211e7e','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 19:30:35'),('5c2c8e49-1204-40e0-a6b0-9937d954f6c3','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','mfa_pending','Password verified, email OTP required','2026-10-02 11:51:54'),('65a9b9b0-d968-437b-8f13-c9a036c8c764','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and authenticator MFA code verified','2026-10-02 14:40:11'),('6bc5a6ee-3a9a-4008-9b7e-54088d23b9a7','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and MFA verified','2026-09-30 18:28:39'),('6d54e207-dc20-4466-bcb8-83383921ea20','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','success','Password and MFA verified','2026-10-01 17:17:51'),('794c9367-4c75-42e0-9bc1-14e78738055e','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, authenticator MFA required','2026-09-30 19:53:08'),('81938d20-9ee6-4504-9533-0825dbcabb46','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_failed','Invalid authenticator MFA code','2026-09-30 19:48:54'),('8257b8cb-7145-4111-aa42-653c9ae5a987','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 13:44:34'),('86bc9103-91b0-4e8d-8a10-dc9f70ea0bc8','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','mfa_pending','Password verified, email OTP required','2026-10-01 16:53:30'),('8bcef25c-780e-4d05-b240-5c0f21e2db0b','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, authenticator MFA required','2026-10-01 14:33:47'),('8ec51495-904f-49cd-b4cd-f57566309a59','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_failed','Invalid MFA verification code','2026-09-30 19:36:43'),('9894c003-cd31-48c5-974c-e4cc6f9b7ba4','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','mfa_pending','Password verified, email OTP required','2026-10-01 17:17:21'),('9e921483-9f85-43b2-9c51-25487326d723','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','success','Password and MFA verified','2026-10-01 17:20:13'),('a9fcb93a-24ec-4327-814d-b673c7e63272','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and authenticator MFA code verified','2026-09-30 19:53:16'),('ac9c10df-5d0b-44a0-93c0-8d2a7cee1724','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 19:34:05'),('b1c4646a-6450-4b6d-bd71-9ffa533f4477','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','success','Password and MFA verified','2026-10-02 11:53:24'),('b332115d-32fb-407e-96ad-50925cce4454','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 19:23:04'),('bd776395-fac4-4958-9e3b-05408a3287cd','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','invalid_password','Account status: pending_approval','2026-10-01 16:48:36'),('c3bca967-50f1-436b-b50d-fc6ad0e1c085','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and authenticator MFA code verified','2026-10-01 14:37:48'),('c481b7b1-c93f-4aab-89ad-5af35026697e','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 19:25:14'),('c7491f2a-27f9-4a35-8ed7-1cd8af5eb17d','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 13:43:25'),('c9ffd8e1-b7d0-48','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','success','Password and MFA verified','2026-09-29 16:35:32'),('cae21feb-26a5-472a-ade9-60c5764392f6','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','invalid_password','Account status: rejected','2026-10-01 16:52:14'),('dad9d752-b8f5-404a-a74d-0446fff39594','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 19:22:48'),('dc512dca-d84f-4af8-a312-1ef7ad8af13d','d.stones.david@gmail.com',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','invalid_email','Email address not found','2026-10-01 17:19:36'),('e5f12799-1f4b-4ca2-b629-c75b9ea97b8c','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and authenticator MFA code verified','2026-09-30 19:51:05'),('e8320054-a7da-44a2-9cdc-cda37a7cada7','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 19:36:29'),('ef952c44-3c04-423d-9a49-13e14c1be72e','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 19:38:55'),('f2f9464e-9564-44e5-bb46-7db1dcfe3c3e','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and MFA verified','2026-09-30 13:44:55'),('f4e68ca0-34c7-49f4-b3e3-573557117fc8','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_failed','Invalid MFA verification code','2026-09-30 19:39:08');
/*!40000 ALTER TABLE `login_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mfa_recovery_codes`
--

DROP TABLE IF EXISTS `mfa_recovery_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `mfa_recovery_codes` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `code_hash` varchar(255) NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_mfa_recovery_user` (`user_id`),
  KEY `idx_mfa_recovery_used` (`user_id`,`used_at`),
  CONSTRAINT `fk_mfa_recovery_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mfa_recovery_codes`
--

LOCK TABLES `mfa_recovery_codes` WRITE;
/*!40000 ALTER TABLE `mfa_recovery_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `mfa_recovery_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organisation_document_reviews`
--

DROP TABLE IF EXISTS `organisation_document_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organisation_document_reviews` (
  `id` char(36) NOT NULL,
  `registration_document_id` char(36) NOT NULL,
  `organisation_id` char(36) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `rejection_reason` text DEFAULT NULL,
  `reviewed_by` char(36) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_review` (`registration_document_id`),
  KEY `idx_document_review_org` (`organisation_id`),
  KEY `idx_document_review_status` (`status`),
  KEY `idx_document_review_reviewer` (`reviewed_by`),
  CONSTRAINT `fk_document_review_document` FOREIGN KEY (`registration_document_id`) REFERENCES `registration_documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_document_review_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_document_review_user` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organisation_document_reviews`
--

LOCK TABLES `organisation_document_reviews` WRITE;
/*!40000 ALTER TABLE `organisation_document_reviews` DISABLE KEYS */;
INSERT INTO `organisation_document_reviews` VALUES ('65ed4777-f0e7-451d-afd7-5d9c9b6fb60c','fedfbab6-7cdd-4e1d-831c-4671ce979d14','0a91a3fc-c629-45a7-a246-70bde778408d','approved',NULL,NULL,'2026-10-02 12:55:38','2026-10-01 17:55:26','2026-10-02 11:55:38'),('90cd4f78-bdc2-11f1-a42e-5081407ad051','291577ed-5a9b-4013-8a2c-3f5b0fc180d7','0a91a3fc-c629-45a7-a246-70bde778408d','approved',NULL,NULL,'2026-10-02 12:55:38','2026-10-01 18:04:37','2026-10-02 11:55:38'),('90cdafe4-bdc2-11f1-a42e-5081407ad051','93f51ad8-2c1d-4054-80df-8d5f77d8f93f','0a91a3fc-c629-45a7-a246-70bde778408d','approved',NULL,NULL,'2026-10-02 12:55:38','2026-10-01 18:04:37','2026-10-02 11:55:38'),('90cdb7bd-bdc2-11f1-a42e-5081407ad051','d7c15eb3-63c1-4f4c-86ca-a51e2ad7ac3f','0a91a3fc-c629-45a7-a246-70bde778408d','approved',NULL,NULL,'2026-10-02 12:55:38','2026-10-01 18:04:37','2026-10-02 11:55:38'),('90cdbea1-bdc2-11f1-a42e-5081407ad051','f9a88e37-a6e0-4a9a-baf5-63029389d1eb','0a91a3fc-c629-45a7-a246-70bde778408d','approved',NULL,NULL,'2026-10-02 12:55:38','2026-10-01 18:04:37','2026-10-02 11:55:38'),('b49e70ad-bdb4-11f1-a42e-5081407ad051','389843a6-bcdc-4ae1-83b4-4f7ec11f54b2','0a91a3fc-c629-45a7-a246-70bde778408d','approved',NULL,NULL,'2026-10-02 12:55:38','2026-10-01 16:25:24','2026-10-02 11:55:38');
/*!40000 ALTER TABLE `organisation_document_reviews` ENABLE KEYS */;
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
INSERT INTO `organisation_members` VALUES ('3db7d60a-da4f-4ce3-9cc4-918982185568','0a91a3fc-c629-45a7-a246-70bde778408d','ff20dfcf-f843-4cd3-a263-412210683de9','183874f2-bc37-11f1-bb55-5081407ad051','CEO','active',NULL,'2026-10-01 19:04:37','2026-10-01 14:33:18');
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
INSERT INTO `organisations` VALUES ('0a91a3fc-c629-45a7-a246-70bde778408d','Atlantic Trade PLC','RC-93749834','343434343','importer','verified','682f7cf2-b05f-4c','2026-10-02 12:55:38',NULL,'2026-10-01 14:33:18','2026-10-02 11:55:38'),('d2beefba-e4bc-4d','TRINU BONDED WAREHOUSE','RC-2555656565','61561651615','terminal','verified',NULL,NULL,NULL,'2026-09-29 12:56:20','2026-09-29 18:00:42');
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
  `mfa_token_hash` varchar(255) DEFAULT NULL,
  `channel` enum('email','sms','whatsapp') NOT NULL DEFAULT 'email',
  `destination` varchar(254) NOT NULL,
  `purpose` enum('login_mfa','password_reset','phone_verify','email_verify','regulator_access') NOT NULL,
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
INSERT INTO `otp_codes` VALUES ('18efe9d9-a4e9-428b-9059-cb255fdbb90c','ff20dfcf-f843-4cd3-a263-412210683de9','$2y$10$zEe.pgy/2odu3.4YYQXD3OVfKtGsDFaW3AeP//ioMgZHPhoL0n64i','99998b587986bcecbacbbc35d9b0d2027a22d780f2224cc9026309c839b8b855','email','d.stone.david@gmail.com','login_mfa',0,5,0,'2026-10-01 18:17:21','2026-10-01 18:22:21','2026-10-01 18:17:51',NULL,'127.0.0.1','2026-10-01 17:17:21'),('83085037-0312-40f3-ad24-bbd189a31254','ff20dfcf-f843-4cd3-a263-412210683de9','$2y$10$vylZ0pZW52.5/OHo93P91usBSUctNCz2gCwz7EjL6odVhBa5DcfE2',NULL,'email','d.stone.david@gmail.com','login_mfa',0,5,1,'2026-10-01 18:00:29','2026-10-01 18:05:29','2026-10-01 18:00:50',NULL,'127.0.0.1','2026-10-01 17:00:29'),('cb488d95-6ba0-4ab1-a0ae-01facb6c45c1','ff20dfcf-f843-4cd3-a263-412210683de9','$2y$10$/kxz/EZNpxUXxyP9ogkDV.Km1pCgNSiAXQfIZco7UAZSWG8ZYzPJq','50504597414772a6752114cd0e1ff37aebbaa503a02b1fd92afef88b9b920629','email','d.stone.david@gmail.com','login_mfa',0,5,0,'2026-10-02 12:51:54','2026-10-02 12:56:54','2026-10-02 12:53:24',NULL,'127.0.0.1','2026-10-02 11:51:54'),('d95ea641-548b-47e7-a025-14fc1366051f','ff20dfcf-f843-4cd3-a263-412210683de9','$2y$10$i1.ObA3L.AOVwg3PW9fYA.995PffplPu0/hN8e6p0cAaClK2JG8Py','7b8fba71ff2540da8f3a7a67bf397447dbf0b00eab05c5115f34c4a121d68d92','email','d.stone.david@gmail.com','login_mfa',0,5,0,'2026-10-01 17:53:30','2026-10-01 17:58:30',NULL,'2026-10-01 17:59:47','127.0.0.1','2026-10-01 16:53:30'),('df6baff0-a97d-4fe1-b196-9de2569e48cb','ff20dfcf-f843-4cd3-a263-412210683de9','$2y$10$IWpJ/TPh9CWnAzvb4.B1Ie3i.nQSU3lin7WL68mhh/GdN7U8a90.G','75dc99e5e00c278793506d9c7aaf82aeaa8982b43b210404921bd3b160d6a303','email','d.stone.david@gmail.com','login_mfa',0,5,0,'2026-10-01 18:19:46','2026-10-01 18:24:46','2026-10-01 18:20:13',NULL,'127.0.0.1','2026-10-01 17:19:46');
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
INSERT INTO `permissions` VALUES ('1838d8fb-bc37-11f1-bb55-5081407ad051','portal.view','portal','view','Access the stakeholder portal.','2026-09-29 17:53:45'),('1838defc-bc37-11f1-bb55-5081407ad051','portal.cargo','portal','cargo','View authorised cargo information.','2026-09-29 17:53:45'),('1838df69-bc37-11f1-bb55-5081407ad051','portal.documents','portal','documents','Access authorised documents.','2026-09-29 17:53:45'),('1838dfa3-bc37-11f1-bb55-5081407ad051','portal.financials','portal','financials','View authorised financial information.','2026-09-29 17:53:45'),('1838dfdd-bc37-11f1-bb55-5081407ad051','portal.requests','portal','requests','Create and manage authorised service requests.','2026-09-29 17:53:45'),('1838e013-bc37-11f1-bb55-5081407ad051','operations.view','operations','view','View terminal operations.','2026-09-29 17:53:45'),('1838e040-bc37-11f1-bb55-5081407ad051','operations.manage','operations','manage','Manage terminal operational workflows.','2026-09-29 17:53:45'),('1838e071-bc37-11f1-bb55-5081407ad051','operations.cargo','operations','cargo','Manage cargo receiving, movements and status workflows.','2026-09-29 17:53:45'),('1838e0a9-bc37-11f1-bb55-5081407ad051','operations.holds','operations','holds','Manage authorised holds and hold-related workflows.','2026-09-29 17:53:45'),('1838e0dd-bc37-11f1-bb55-5081407ad051','operations.examination','operations','examination','Manage examination scheduling and evidence capture without making Customs decisions.','2026-09-29 17:53:45'),('1838e115-bc37-11f1-bb55-5081407ad051','gate.view','gate','view','View gate operations and bookings.','2026-09-29 17:53:45'),('1838e144-bc37-11f1-bb55-5081407ad051','gate.bookings','gate','bookings','Manage vehicle and gate bookings.','2026-09-29 17:53:45'),('1838e174-bc37-11f1-bb55-5081407ad051','gate.admit','gate','admit','Perform authorised gate admission decisions.','2026-09-29 17:53:45'),('1838e1a4-bc37-11f1-bb55-5081407ad051','gate.refer','gate','refer','Refer gate movements with reasons.','2026-09-29 17:53:45'),('1838e1d8-bc37-11f1-bb55-5081407ad051','gate.reject','gate','reject','Reject gate movements with reasons.','2026-09-29 17:53:45'),('1838e20a-bc37-11f1-bb55-5081407ad051','gate.override','gate','override','Perform supervisor-authorised gate overrides.','2026-09-29 17:53:45'),('1838e23e-bc37-11f1-bb55-5081407ad051','gate.gate_out','gate','gate_out','Perform gate-out and release checks within assigned authority.','2026-09-29 17:53:45'),('1838e270-bc37-11f1-bb55-5081407ad051','warehouse.view','warehouse','view','View warehouse and yard information.','2026-09-29 17:53:45'),('1838e2a1-bc37-11f1-bb55-5081407ad051','warehouse.receive','warehouse','receive','Receive and tally cargo.','2026-09-29 17:53:45'),('1838e2d6-bc37-11f1-bb55-5081407ad051','warehouse.inventory','warehouse','inventory','Manage inventory counts and approved adjustments.','2026-09-29 17:53:45'),('1838e30e-bc37-11f1-bb55-5081407ad051','warehouse.position','warehouse','position','Position and relocate cargo.','2026-09-29 17:53:45'),('1838e347-bc37-11f1-bb55-5081407ad051','warehouse.pick','warehouse','pick','Pick cargo for authorised workflows.','2026-09-29 17:53:45'),('1838e37c-bc37-11f1-bb55-5081407ad051','documents.view','documents','view','View authorised documents.','2026-09-29 17:53:45'),('1838e3af-bc37-11f1-bb55-5081407ad051','documents.manage','documents','manage','Register and manage documents.','2026-09-29 17:53:45'),('1838e3e0-bc37-11f1-bb55-5081407ad051','documents.verify','documents','verify','Verify documents.','2026-09-29 17:53:45'),('1838e414-bc37-11f1-bb55-5081407ad051','documents.issue','documents','issue','Issue authorised terminal documents.','2026-09-29 17:53:45'),('1838e445-bc37-11f1-bb55-5081407ad051','finance.view','finance','view','View financial information.','2026-09-29 17:53:45'),('1838e477-bc37-11f1-bb55-5081407ad051','finance.tariffs','finance','tariffs','Manage tariffs and charging rules within authority.','2026-09-29 17:53:45'),('1838e4a9-bc37-11f1-bb55-5081407ad051','finance.invoices','finance','invoices','Manage invoices, credit notes and receipts within authority.','2026-09-29 17:53:45'),('1838e4db-bc37-11f1-bb55-5081407ad051','finance.payments','finance','payments','Manage payment records and payment confirmation workflows.','2026-09-29 17:53:45'),('1838e50a-bc37-11f1-bb55-5081407ad051','finance.reconciliation','finance','reconciliation','Perform payment and bank reconciliation.','2026-09-29 17:53:45'),('1838e53a-bc37-11f1-bb55-5081407ad051','finance.collections','finance','collections','Manage collections, ageing and dunning workflows.','2026-09-29 17:53:45'),('1838e56b-bc37-11f1-bb55-5081407ad051','finance.adjustments','finance','adjustments','Manage authorised financial adjustments, discounts and waivers.','2026-09-29 17:53:45'),('1838e59a-bc37-11f1-bb55-5081407ad051','reports.view','reports','view','View role-scoped reports.','2026-09-29 17:53:45'),('1838e5c9-bc37-11f1-bb55-5081407ad051','reports.export','reports','export','Export role-scoped reports.','2026-09-29 17:53:45'),('1838e5fa-bc37-11f1-bb55-5081407ad051','reports.management','reports','management','Access management reporting and analytics.','2026-09-29 17:53:45'),('1838e62d-bc37-11f1-bb55-5081407ad051','customer_service.view','customer_service','view','View customer service and sales records.','2026-09-29 17:53:45'),('1838e65c-bc37-11f1-bb55-5081407ad051','customer_service.manage','customer_service','manage','Manage customer service workflows.','2026-09-29 17:53:45'),('1838e68d-bc37-11f1-bb55-5081407ad051','customer_service.quotes','customer_service','quotes','Manage enquiries and quotations.','2026-09-29 17:53:45'),('1838e6c1-bc37-11f1-bb55-5081407ad051','customer_service.onboarding','customer_service','onboarding','Manage KYC and onboarding workflows.','2026-09-29 17:53:45'),('1838e6fa-bc37-11f1-bb55-5081407ad051','compliance.view','compliance','view','View compliance and Customs liaison records.','2026-09-29 17:53:45'),('1838e72a-bc37-11f1-bb55-5081407ad051','compliance.manage','compliance','manage','Manage compliance workflows and authorised Customs references.','2026-09-29 17:53:45'),('1838e75b-bc37-11f1-bb55-5081407ad051','compliance.audit','compliance','audit','Prepare authorised audit and compliance responses.','2026-09-29 17:53:45'),('1838e78b-bc37-11f1-bb55-5081407ad051','management.dashboard','management','dashboard','Access management dashboards.','2026-09-29 17:53:45'),('1838e7d5-bc37-11f1-bb55-5081407ad051','management.reports','management','reports','Access management reports and analytics.','2026-09-29 17:53:45'),('1838e809-bc37-11f1-bb55-5081407ad051','administration.users','administration','users','Manage users and memberships.','2026-09-29 17:53:45'),('1838e83b-bc37-11f1-bb55-5081407ad051','administration.roles','administration','roles','Manage roles.','2026-09-29 17:53:45'),('1838e86a-bc37-11f1-bb55-5081407ad051','administration.permissions','administration','permissions','Manage permissions and role assignments.','2026-09-29 17:53:45'),('1838e89f-bc37-11f1-bb55-5081407ad051','administration.configuration','administration','configuration','Manage designated business configuration.','2026-09-29 17:53:45'),('1838e8d6-bc37-11f1-bb55-5081407ad051','administration.audit','administration','audit','View and export audit records.','2026-09-29 17:53:45'),('1838e909-bc37-11f1-bb55-5081407ad051','administration.feature_flags','administration','feature_flags','Manage feature flags and maintenance controls.','2026-09-29 17:53:45'),('1838e93f-bc37-11f1-bb55-5081407ad051','administration.integrations','administration','integrations','Manage integration configuration and operational controls.','2026-09-29 17:53:45'),('1838e977-bc37-11f1-bb55-5081407ad051','system.organisations','system','organisations','Manage and view all organisations.','2026-09-29 17:53:45'),('1838e9a8-bc37-11f1-bb55-5081407ad051','system.users','system','users','Manage users across the platform.','2026-09-29 17:53:45'),('1838e9dc-bc37-11f1-bb55-5081407ad051','system.roles','system','roles','Manage platform roles and permissions.','2026-09-29 17:53:45'),('1838ea93-bc37-11f1-bb55-5081407ad051','system.audit','system','audit','View platform-wide audit information.','2026-09-29 17:53:45'),('1838ead1-bc37-11f1-bb55-5081407ad051','system.configuration','system','configuration','Manage platform-wide configuration.','2026-09-29 17:53:45');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registration_documents`
--

DROP TABLE IF EXISTS `registration_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `registration_documents` (
  `id` char(36) NOT NULL,
  `registration_request_id` char(36) NOT NULL,
  `document_type` enum('cac','tin','signatory_id','licence') NOT NULL,
  `licence_type` varchar(80) DEFAULT NULL,
  `licence_reference` varchar(150) DEFAULT NULL,
  `file_path` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_size` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_registration_document_request` (`registration_request_id`),
  KEY `idx_registration_document_type` (`document_type`),
  KEY `idx_registration_document_licence` (`licence_type`),
  CONSTRAINT `fk_registration_document_request` FOREIGN KEY (`registration_request_id`) REFERENCES `registration_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registration_documents`
--

LOCK TABLES `registration_documents` WRITE;
/*!40000 ALTER TABLE `registration_documents` DISABLE KEYS */;
INSERT INTO `registration_documents` VALUES ('291577ed-5a9b-4013-8a2c-3f5b0fc180d7','a6567683-4fd3-4513-9205-d464aeec0b2f','licence','nafdac','32323','uploads/4c24ac1faf2026_10_01_03_33_18ages.jpg','images.jpg','image/jpeg',30816,'2026-10-01 14:33:18'),('389843a6-bcdc-4ae1-83b4-4f7ec11f54b2','a6567683-4fd3-4513-9205-d464aeec0b2f','licence','son','23232','uploads/a3e3f455e82026_10_01_03_33_18NCAP.png','SONCAP.png','image/png',65868,'2026-10-01 14:33:18'),('93f51ad8-2c1d-4054-80df-8d5f77d8f93f','a6567683-4fd3-4513-9205-d464aeec0b2f','tin',NULL,NULL,'uploads/c994eddf212026_10_01_03_33_18ance.jpg','Tax-clearance.jpg','image/jpeg',56688,'2026-10-01 14:33:18'),('d7c15eb3-63c1-4f4c-86ca-a51e2ad7ac3f','a6567683-4fd3-4513-9205-d464aeec0b2f','signatory_id',NULL,NULL,'uploads/8c7e3ac2ba2026_10_01_03_33_18ence.jpg','drivers-licence.jpg','image/jpeg',83149,'2026-10-01 14:33:18'),('f9a88e37-a6e0-4a9a-baf5-63029389d1eb','a6567683-4fd3-4513-9205-d464aeec0b2f','cac',NULL,NULL,'uploads/568e0915192026_10_01_03_33_18CAC.jpg','CAC.jpg','image/jpeg',213489,'2026-10-01 14:33:18'),('fedfbab6-7cdd-4e1d-831c-4671ce979d14','a6567683-4fd3-4513-9205-d464aeec0b2f','licence','son','23232','uploads/658d9901b683976269a580cd86254659_2026_10_01_18_55_26.png','SONCAP.png','image/png',65868,'2026-10-01 17:55:26');
/*!40000 ALTER TABLE `registration_documents` ENABLE KEYS */;
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
INSERT INTO `registration_otps` VALUES ('00823cb4-a54d-40b7-8719-b99463900d28','a6567683-4fd3-4513-9205-d464aeec0b2f','sms','08164902529','$2y$10$.ydcCE/Y4NQRj2OfYdQRaumrdvyVoepWmuMxCZ91y0aloOCi77.mi','registration_phone',0,5,0,'2026-10-01 15:31:17','2026-10-01 15:36:16','2026-10-01 15:33:16',NULL,'2026-10-01 14:31:17'),('1b1d4d39-74e2-43cf-b40b-f614395a6f14','b9595407-e16c-4283-a3f5-bc2d945d1d91','email','d.stone.david@gmail.com','$2y$10$EFuePpx//7zFfiv05ioAOOVCIesdE2nELJQqL6uNUoW1maCeuhxWe','registration_email',0,5,0,'2026-10-01 14:48:16','2026-10-01 14:53:16','2026-10-01 14:48:41',NULL,'2026-10-01 13:48:16'),('70742082-19dc-4087-8043-7fc947ceca72','b9595407-e16c-4283-a3f5-bc2d945d1d91','sms','08164902529','$2y$10$ooWSaK2Ey3epPNaFO18UduKARGyo.kpcjHzia9mOQrMuKwdmFKRGW','registration_phone',0,5,0,'2026-10-01 15:06:53','2026-10-01 15:11:52',NULL,NULL,'2026-10-01 14:06:53'),('a5c702ec-ce0b-446b-a001-cb0f715dd79f','a6567683-4fd3-4513-9205-d464aeec0b2f','email','d.stone.david@gmail.com','$2y$10$S2rRnRw6kzkgsZhMhWfybuT7ZA7SXuwrrELaDZpL43DYV0PatbnFC','registration_email',0,5,0,'2026-10-01 15:30:50','2026-10-01 15:35:50','2026-10-01 15:31:14',NULL,'2026-10-01 14:30:50'),('bcbb8403-b1d0-47','a5abe645-d228-4f','email','hqfdevelopers@gmail.com','$2y$10$SEfXGJLeG/4rmVCL2kBv8.Rhuo38/HpS/5rITnXfFcB6wqDrcr.kK','registration_email',0,5,0,'2026-09-29 14:55:35','2026-09-29 15:00:35','2026-10-01 15:31:14',NULL,'2026-09-29 12:55:35');
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
INSERT INTO `registration_requests` VALUES ('a5abe645-d228-4f','49f75b78-b5c9-4d9d-9d1a-ea3b8847dff1','importer','Mathias','hqfdevelopers@gmail.com','+2348164902529','$2y$10$T/EwX7MAZLm.S7MkDiYHveorvUIBR3m.zfrkuuKFn6kQ5PiGmgM62','Antlatic Electronics trades','RC-2555656565','61561651615','Manager','completed','2026-09-29 14:56:17',NULL,1,1,'1.0','1.0','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','2026-09-29 15:25:35','682f7cf2-b05f-4c','2026-09-29 12:55:35','2026-09-29 12:56:20'),('a6567683-4fd3-4513-9205-d464aeec0b2f','7c95dd36-011d-4668-9de9-c378ec26270e','importer','Eloike david','d.stone.david@gmail.com','08164902529','$2y$10$zcBBokR1lYIJ79F46S/0NuQVBAvdct7rQnRmQGWTtWbHow4Ap0Ou2','Atlantic Trade PLC','RC-93749834','343434343','CEO','completed','2026-10-01 15:31:14','2026-10-01 15:33:16',1,1,'1.0','1.0','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-01 16:00:50','ff20dfcf-f843-4cd3-a263-412210683de9','2026-10-01 14:30:50','2026-10-01 14:33:18'),('b9595407-e16c-4283-a3f5-bc2d945d1d91','a1ae81fe-853a-473f-80f4-a2513dc7d149','importer','Eloike David','d.stone.david@gmail.com','08164902529','$2y$10$eZNxGAThQvMZzUSdMmt/i.3LABuyMHpmn7HftXnTCPh00ZctOhsay','Atlantic Trade PLC','RC-6454546','5654654654','Manager','expired','2026-10-01 14:48:41',NULL,1,1,'1.0','1.0','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-01 15:18:16',NULL,'2026-10-01 13:48:16','2026-10-01 14:28:35');
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
INSERT INTO `role_permissions` VALUES ('18386d94-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e5fa-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e62d-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e65c-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e68d-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e6c1-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e6fa-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e72a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e75b-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e78b-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e7d5-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e809-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e83b-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e86a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e89f-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e8d6-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e909-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e93f-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e977-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e9a8-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e9dc-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838ea93-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838ead1-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e5fa-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e62d-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e65c-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e68d-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e6c1-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e6fa-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e72a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e75b-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e78b-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e7d5-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e809-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e83b-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e86a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e89f-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e8d6-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e909-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e93f-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e5fa-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e78b-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e7d5-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e62d-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e65c-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e68d-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e6c1-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e6fa-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e72a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e75b-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 17:53:45');
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
INSERT INTO `roles` VALUES ('18386d94-bc37-11f1-bb55-5081407ad051','system_admin','System Administrator','system','Platform-wide administration across all organisations.',1,'2026-09-29 17:53:45','2026-09-29 17:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','organisation_owner','Organisation Owner','organisation','Full access to the organisation and its operational functions.',1,'2026-09-29 17:53:45','2026-09-29 17:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','management','Management','organisation','Management dashboards, reports and authorised operational and financial visibility.',1,'2026-09-29 17:53:45','2026-09-29 17:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','finance','Finance','organisation','Tariffs, invoices, payments, collections and reconciliation.',1,'2026-09-29 17:53:45','2026-09-29 17:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','terminal_operations','Terminal Operations','system','Cargo receiving, movements, holds, exceptions and operational workflows.',1,'2026-09-29 17:53:45','2026-10-02 14:39:24'),('18387679-bc37-11f1-bb55-5081407ad051','gate_officer','Gate Officer','system','Gate bookings, gate decisions, gate-in and gate-out operations.',1,'2026-09-29 17:53:45','2026-10-02 14:38:51'),('183876de-bc37-11f1-bb55-5081407ad051','warehouse_yard_officer','Warehouse / Yard Officer','system','Warehouse, yard, inventory, positioning, picking and relocation operations.',1,'2026-09-29 17:53:45','2026-10-02 14:38:56'),('1838771d-bc37-11f1-bb55-5081407ad051','documentation_officer','Documentation Officer','system','Document registration, verification and issuance.',1,'2026-09-29 17:53:45','2026-10-02 14:39:16'),('1838775d-bc37-11f1-bb55-5081407ad051','customer_service_sales','Customer Service / Sales','organisation','Enquiries, quotations, onboarding and customer service workflows.',1,'2026-09-29 17:53:45','2026-09-29 17:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','compliance_customs_liaison','Compliance / Customs Liaison','organisation','Compliance workflows, Customs liaison and audit response.',1,'2026-09-29 17:53:45','2026-09-29 17:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','regulator_auditor','Regulator / Auditor','organisation','Scoped read-only access to authorised records.',1,'2026-09-29 17:53:45','2026-09-29 17:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','portal_user','Portal User','organisation','Basic authorised stakeholder portal access.',1,'2026-09-29 17:53:45','2026-09-29 17:53:45');
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
INSERT INTO `sessions` VALUES ('0997562a-0144-448b-a90d-063ffddd8167','ff20dfcf-f843-4cd3-a263-412210683de9','33b8ceaf16748dafd377c91d39e5e15c266ebbe4a0eae2619e2380d490b6fd46',NULL,'Firefox on Windows (Desktop)','unknown',NULL,NULL,'127.0.0.1','Abuja, FCT, Nigeria',0,1,'2026-10-01 18:00:50','2026-10-31 18:00:50',NULL,NULL,'2026-10-01 17:00:50'),('3881279e-11ea-4f3c-9d76-11927c1c28ac','ff20dfcf-f843-4cd3-a263-412210683de9','24218105a69709b7eab7a7efdfa80417e9ab77cbf3344d0195c182a3eaa784c3',NULL,'Firefox on Windows (Desktop)','unknown',NULL,NULL,'127.0.0.1','Abuja, FCT, Nigeria',0,1,'2026-10-02 12:53:24','2026-11-01 12:53:24',NULL,NULL,'2026-10-02 11:53:24'),('63ffc6d7-032d-435a-bdcf-6145ecb541c2','ff20dfcf-f843-4cd3-a263-412210683de9','fd54b95fe5fb1f4222c5491124179f80f3389ee8a6d955368df682690f48f1b4',NULL,'Firefox on Windows (Desktop)','unknown',NULL,NULL,'127.0.0.1','Abuja, FCT, Nigeria',0,1,'2026-10-01 18:20:13','2026-10-31 18:20:13',NULL,NULL,'2026-10-01 17:20:13'),('67e4f923-400e-4655-a67a-7e1bb74bcb24','ff20dfcf-f843-4cd3-a263-412210683de9','04fdd5b13e825690fa60d0de193c51a9d6f6b13e8c9235df9a412cdefc2c2c62',NULL,'Firefox on Windows (Desktop)','unknown',NULL,NULL,'127.0.0.1','Abuja, FCT, Nigeria',0,1,'2026-10-01 18:17:51','2026-10-31 18:17:51',NULL,NULL,'2026-10-01 17:17:51');
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
-- Table structure for table `user_invitations`
--

DROP TABLE IF EXISTS `user_invitations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_invitations` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `invited_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invitation_token` (`token_hash`),
  KEY `idx_invitation_user` (`user_id`),
  KEY `idx_invitation_expiry` (`expires_at`),
  KEY `idx_invitation_invited_by` (`invited_by`),
  CONSTRAINT `fk_invitation_invited_by` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_invitation_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_invitations`
--

LOCK TABLES `user_invitations` WRITE;
/*!40000 ALTER TABLE `user_invitations` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_invitations` ENABLE KEYS */;
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
  `pics` varchar(200) NOT NULL DEFAULT 'avatar.png',
  `password_hash` varchar(255) NOT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `phone_verified_at` datetime DEFAULT NULL,
  `mfa_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `mfa_secret` text DEFAULT NULL,
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
INSERT INTO `users` VALUES ('c0654f0b-8452-4a03-a43d-0d0cda17da1b',NULL,'system','1838771d-bc37-11f1-bb55-5081407ad051','Mathias Jacobs','hfqsystem@gmail.com','+2342048876135','avatar.png','',NULL,NULL,0,NULL,'pending_approval',0,NULL,NULL,NULL,'2026-10-02 17:44:33','2026-10-02 17:44:33'),('ff20dfcf-f843-4cd3-a263-412210683de9','0a91a3fc-c629-45a7-a246-70bde778408d','organisation',NULL,'Eloike david','d.stone.david@gmail.com','08164902529','avatar.png','$2y$10$zcBBokR1lYIJ79F46S/0NuQVBAvdct7rQnRmQGWTtWbHow4Ap0Ou2','2026-10-01 15:31:14','2026-10-01 15:33:16',0,NULL,'active',0,NULL,'2026-10-02 12:53:24','2026-10-01 15:33:18','2026-10-01 14:33:18','2026-10-02 14:04:02');
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

-- Dump completed on 2026-10-02 18:48:18
