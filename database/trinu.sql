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
INSERT INTO `account_events` VALUES ('00c03481-817a-4c5b-8c49-e7f2e7cc4627','ff20dfcf-f843-4cd3-a263-412210683de9','signout','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','{\"session_id\":\"a3f27df2-f1da-4bf5-9b3a-b2534634d20b\"}','2026-10-03 10:25:10'),('110235f9-c456-4d8f-b76b-6c77e4c5c1a1','ff20dfcf-f843-4cd3-a263-412210683de9','phone_verified','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','{\"message\":\"Phone number verified during registration.\",\"registration_ref\":\"7c95dd36-011d-4668-9de9-c378ec26270e\"}','2026-10-01 13:33:18'),('1c9eac8d-e3ae-4c49-aeb3-14bf21fb2482','ff20dfcf-f843-4cd3-a263-412210683de9','email_verified','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','{\"message\":\"Email verified during registration.\",\"registration_ref\":\"7c95dd36-011d-4668-9de9-c378ec26270e\"}','2026-10-01 13:33:18'),('309f1d61-b6ab-4c5b-8411-bf800a1e5f6b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','signout','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','{\"session_id\":\"93be56df-70db-4316-9ec4-7eae6a0f4e02\"}','2026-10-08 18:18:08'),('db7c975e-27bb-43d1-ab99-c900d2189297','e4d5623b-c569-4ac9-ba75-9bdd7968a70b','signout','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','{\"session_id\":\"9bf50d51-f64f-4f03-91e5-685244ff6a08\"}','2026-10-08 11:45:13'),('efd8294d-1bbc-4b26-a45f-3a114decf7e3','ff20dfcf-f843-4cd3-a263-412210683de9','signout','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','{\"session_id\":\"f7452715-902e-4e4b-89bc-558d85dda6a1\"}','2026-10-03 11:21:09');
/*!40000 ALTER TABLE `account_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_config_section_visits`
--

DROP TABLE IF EXISTS `admin_config_section_visits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_config_section_visits` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `section_key` varchar(80) NOT NULL,
  `visit_count` int(10) unsigned NOT NULL DEFAULT 1,
  `last_visited_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admin_config_section_visit` (`user_id`,`section_key`),
  KEY `idx_admin_config_visit_user` (`user_id`),
  KEY `idx_admin_config_visit_section` (`section_key`),
  KEY `idx_admin_config_visit_count` (`visit_count`),
  KEY `idx_admin_config_last_visited` (`last_visited_at`),
  CONSTRAINT `fk_admin_config_visit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_config_section_visits`
--

LOCK TABLES `admin_config_section_visits` WRITE;
/*!40000 ALTER TABLE `admin_config_section_visits` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_config_section_visits` ENABLE KEYS */;
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
INSERT INTO `login_attempts` VALUES ('010ce483-e487-4a50-abee-e10f2535976e','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','invalid_password','Account status: pending_approval','2026-10-01 15:49:01'),('01d589a5-8174-4498-8345-516c59ea5363','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-07 13:19:34'),('02285af2-d857-473f-9fc2-a75cb475f851','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','invalid_email','Email address not found','2026-10-03 10:15:02'),('099cb9be-595d-4798-a673-accf5d1c905c','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-07 14:16:39'),('0b147a5e-457a-4099-9898-53fababc99e1','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 17:27:38'),('0fe5e6e5-e192-4b6d-b88d-64e6324e3eea','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 18:21:46'),('10766f14-2dc3-4cf5-b4f1-5ca1e556c99d','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','success','Password and MFA verified','2026-10-01 16:00:50'),('14a5260c-982e-4394-bb36-e06786021b6f','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, authenticator MFA required','2026-09-30 18:48:28'),('1ddb8d5c-01cc-4737-b89d-387a7bb345db','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_failed','Invalid MFA verification code','2026-09-30 18:38:48'),('229e43fe-fbe6-4c5e-99e9-c02b19f5d73a','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 14:00:25'),('286c8eb4-0211-4844-98f1-9cf49bb3d78c','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','invalid_email','Email address not found','2026-10-03 10:14:48'),('2d65059c-2f32-4e9b-864f-9f7a97321a15','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 18:20:14'),('2f083a89-7585-4c99-b941-b9295ae7fd02','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-07 13:20:06'),('32fa88cf-d94c-46f8-afd9-ab9966020ec2','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 14:32:10'),('3481d046-a14f-4e2d-a6d3-b9b10ed7a954','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 14:04:00'),('3815349f-ea59-4436-af63-790d2d480ae3','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','mfa_pending','Password verified, email OTP required','2026-10-01 16:19:46'),('404c85fc-ad0e-444a-bf8f-1112fecfbea7','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 15:18:50'),('41954f0d-978f-4aa3-852d-b7ece9efd1af','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','invalid_password','Account status: pending_approval','2026-10-03 11:21:50'),('486575ab-2b9d-4d25-b881-ab9014259682','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 13:59:49'),('5010a717-4873-4d73-8266-61d7aa44d6e5','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_failed','Invalid authenticator MFA code','2026-09-30 18:49:06'),('55e8884d-e39a-4507-8570-714dbdb9fbc9','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','invalid_password','Invalid password','2026-10-03 11:21:12'),('570a9ecf-516b-4f01-bb99-db267e7d5bb5','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and MFA verified','2026-10-03 10:26:14'),('57aaaadf-b3c5-43f5-bfcb-8e3668762fea','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, authenticator MFA required','2026-10-02 13:39:45'),('582f3189-4cf9-468a-91eb-7ed591211e7e','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 18:30:35'),('5bf3f2ff-ce32-4ef2-82c5-735eb6c658cc','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 13:43:57'),('5c2c8e49-1204-40e0-a6b0-9937d954f6c3','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','mfa_pending','Password verified, email OTP required','2026-10-02 10:51:54'),('635c7654-981c-4479-9d51-678d56527f44','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 15:17:06'),('65a9b9b0-d968-437b-8f13-c9a036c8c764','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and authenticator MFA code verified','2026-10-02 13:40:11'),('6bc5a6ee-3a9a-4008-9b7e-54088d23b9a7','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and MFA verified','2026-09-30 17:28:39'),('6d54e207-dc20-4466-bcb8-83383921ea20','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','success','Password and MFA verified','2026-10-01 16:17:51'),('7308b913-5552-4bba-b17c-7566525a41d3','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 14:01:16'),('794c9367-4c75-42e0-9bc1-14e78738055e','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, authenticator MFA required','2026-09-30 18:53:08'),('7ac6a974-e22e-47c7-84ad-0191adabdd21','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-05 17:30:05'),('7e920bf4-b936-4ddd-8071-76f033e43578','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 15:03:13'),('81938d20-9ee6-4504-9533-0825dbcabb46','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_failed','Invalid authenticator MFA code','2026-09-30 18:48:54'),('8257b8cb-7145-4111-aa42-653c9ae5a987','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 12:44:34'),('83938b3a-a5bc-4481-a880-00a7a5787575','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-05 17:29:45'),('86bc9103-91b0-4e8d-8a10-dc9f70ea0bc8','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','mfa_pending','Password verified, email OTP required','2026-10-01 15:53:30'),('86c433b2-937b-4f30-bb91-4b7a723644ee','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and MFA verified','2026-10-07 13:30:28'),('8bcef25c-780e-4d05-b240-5c0f21e2db0b','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, authenticator MFA required','2026-10-01 13:33:47'),('8c848394-7bc4-4592-b883-c79a0a586abd','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-07 13:27:37'),('8ec51495-904f-49cd-b4cd-f57566309a59','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_failed','Invalid MFA verification code','2026-09-30 18:36:43'),('90b92c73-51a1-45fb-860c-ed7da0ff73f6','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-07 13:25:17'),('94b7c99c-d1be-4c7e-a604-4c501975255f','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and MFA verified','2026-10-03 10:17:01'),('9894c003-cd31-48c5-974c-e4cc6f9b7ba4','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','mfa_pending','Password verified, email OTP required','2026-10-01 16:17:21'),('9aabbb7c-dd18-4647-b1fc-3d705207235b','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','success','Password and MFA verified','2026-10-03 14:01:42'),('9ae5773a-5ab4-4651-8ba6-f4ed3225c6a7','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 11:29:31'),('9b72ecda-6249-420c-9d18-2c602cd9bf14','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 14:33:37'),('9e921483-9f85-43b2-9c51-25487326d723','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','success','Password and MFA verified','2026-10-01 16:20:13'),('9fd18e8c-0634-4940-9528-6f0dd2b54267','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','invalid_password','Account status: pending_approval','2026-10-03 13:38:54'),('a2806d2c-211b-49b1-8c23-822020d41139','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-08 14:05:01'),('a5b60678-1567-4369-b042-32eaae713b67','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and MFA verified','2026-10-08 18:18:35'),('a9fcb93a-24ec-4327-814d-b673c7e63272','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and authenticator MFA code verified','2026-09-30 18:53:16'),('ac9c10df-5d0b-44a0-93c0-8d2a7cee1724','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 18:34:05'),('b1c3b81c-1b6b-4753-a3b3-8570d17eb695','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','invalid_email','Email address not found','2026-10-03 10:25:19'),('b1c4646a-6450-4b6d-bd71-9ffa533f4477','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','success','Password and MFA verified','2026-10-02 10:53:24'),('b332115d-32fb-407e-96ad-50925cce4454','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 18:23:04'),('b3a25c16-50ac-4732-83cc-b8ff8d5f6ff3','lovebiteonline4@gmail.com','e4d5623b-c569-4ac9-ba75-9bdd7968a70b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','invalid_password','Login not permitted. User status: active, organisation status: none','2026-10-07 16:51:46'),('b942fc42-cc4e-4553-ba2a-4eb560f56c5c','lovebiteonline4@gmail.com','e4d5623b-c569-4ac9-ba75-9bdd7968a70b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-07 17:02:25'),('bb01a381-571f-4f06-ad6d-799b7786b0f8','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 14:29:51'),('bd776395-fac4-4958-9e3b-05408a3287cd','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','invalid_password','Account status: pending_approval','2026-10-01 15:48:36'),('be110b3b-1007-486b-b796-1ad6b17ff164','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-07 13:20:58'),('c13fc1c4-1c8d-4c45-9ce1-101c3c1d7831','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 13:44:29'),('c1e164eb-5a3a-4d23-853d-213825fe8cfa','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 10:16:16'),('c2ccc11a-ab85-43f7-90d1-0cc07def0bab','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and MFA verified','2026-10-08 17:53:05'),('c3bca967-50f1-436b-b50d-fc6ad0e1c085','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and authenticator MFA code verified','2026-10-01 13:37:48'),('c481b7b1-c93f-4aab-89ad-5af35026697e','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 18:25:14'),('c7491f2a-27f9-4a35-8ed7-1cd8af5eb17d','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 12:43:25'),('c7b13a41-7501-4341-a0c6-63045dd97960','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-08 17:25:55'),('c8418fba-425e-4d0e-a106-e1e867dbc020','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and MFA verified','2026-10-03 11:36:27'),('c895a43e-bf80-4178-b79b-cc737031e788','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 14:33:12'),('c9ffd8e1-b7d0-48','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','success','Password and MFA verified','2026-09-29 15:35:32'),('cae21feb-26a5-472a-ade9-60c5764392f6','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','invalid_password','Account status: rejected','2026-10-01 15:52:14'),('cc66fae1-1237-4aeb-b9fa-d19392ac62bc','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 14:10:11'),('cca9e7de-61c1-47d4-aab1-9d4a5d938eda','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','success','Password and MFA verified','2026-10-03 14:30:23'),('cdd87866-00e3-4604-b21b-5f253b29fcca','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 14:35:06'),('cfe357e6-ff8e-4bda-822c-5fc3c595594e','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36','success','Password and MFA verified','2026-10-07 14:17:14'),('d04d8479-d0f4-492b-9ede-024d28b4c6f7','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','invalid_password','Account status: pending_approval','2026-10-03 13:38:48'),('d1e921ed-5aaa-42a7-a505-6e8908695006','hfqsystem@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','invalid_password','Invalid password','2026-10-03 10:15:45'),('d26f8979-f37f-482c-ba5b-d6a42d300151','lovebiteonline4@gmail.com','e4d5623b-c569-4ac9-ba75-9bdd7968a70b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','invalid_password','Login not permitted. User status: active, organisation status: none','2026-10-07 17:02:02'),('d3b7e870-969e-43f3-8d00-603cb28d5ecc','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','success','Password and MFA verified','2026-10-03 13:46:01'),('dad9d752-b8f5-404a-a74d-0446fff39594','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 18:22:48'),('dc512dca-d84f-4af8-a312-1ef7ad8af13d','d.stones.david@gmail.com',NULL,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','invalid_email','Email address not found','2026-10-01 16:19:36'),('deb48ade-30f2-4326-9525-8483a9ed564b','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 14:03:04'),('e3256463-b547-4e38-aa52-0cb9c1c6066a','lovebiteonline4@gmail.com','e4d5623b-c569-4ac9-ba75-9bdd7968a70b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','success','Password and MFA verified','2026-10-07 17:02:46'),('e5f12799-1f4b-4ca2-b629-c75b9ea97b8c','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and authenticator MFA code verified','2026-09-30 18:51:05'),('e651b3ae-23bd-4e6b-95e8-f7ebaefd8ac5','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 14:37:12'),('e8320054-a7da-44a2-9cdc-cda37a7cada7','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 18:36:29'),('e8dbedbe-f0c2-429c-a112-3a69e03998ee','d.stone.david@gmail.com','ff20dfcf-f843-4cd3-a263-412210683de9','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 10:25:41'),('e926566f-527a-4ac9-9892-e8f213cfb4c2','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','invalid_email','Email address not found','2026-10-03 10:14:15'),('eb884960-c6da-4995-813e-c2ac02d59b6a','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-03 15:13:58'),('ed0be704-c8ac-4db6-a16a-7798550919fc','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-08 18:18:13'),('ef952c44-3c04-423d-9a49-13e14c1be72e','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, MFA required','2026-09-30 18:38:55'),('f00332df-d418-428b-867c-f0eecb42c396','hfqsystem@gmail.com','53698470-56d3-4848-b65c-097021bd2823','127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:157.0) Gecko/20100101 Firefox/157.0','invalid_password','Account status: pending_approval','2026-10-03 11:21:00'),('f2300530-ff9e-4d88-bf76-454ede5f8bb8','eloike92@gmail.com','4a9ba8d5-93b6-4b65-af96-934920afcd18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','success','Password and MFA verified','2026-10-03 14:32:30'),('f2f9464e-9564-44e5-bb46-7db1dcfe3c3e','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','success','Password and MFA verified','2026-09-30 12:44:55'),('f4e68ca0-34c7-49f4-b3e3-573557117fc8','hqfdevelopers@gmail.com',NULL,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_failed','Invalid MFA verification code','2026-09-30 18:39:08'),('f934ffb5-1bb2-4066-9eaf-afa61f115f70','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-08 17:36:02'),('fa707d7c-3ced-44f9-b0aa-508a9fc5e9db','hqfdevelopers@gmail.com','c0654f0b-8452-4a03-a43d-0d0cda17da1b','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','mfa_pending','Password verified, email OTP required','2026-10-07 13:19:22');
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
-- Table structure for table `organisation_audit_logs`
--

DROP TABLE IF EXISTS `organisation_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organisation_audit_logs` (
  `id` char(36) NOT NULL,
  `organisation_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `action` varchar(100) NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_org_audit_org_time` (`organisation_id`,`created_at`),
  KEY `idx_org_audit_user` (`user_id`),
  CONSTRAINT `fk_org_audit_org` FOREIGN KEY (`organisation_id`) REFERENCES `organisations` (`id`),
  CONSTRAINT `fk_org_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organisation_audit_logs`
--

LOCK TABLES `organisation_audit_logs` WRITE;
/*!40000 ALTER TABLE `organisation_audit_logs` DISABLE KEYS */;
INSERT INTO `organisation_audit_logs` VALUES ('0877be2b-e437-f815-ba24-2b1e408a0817','d2beefba-e4bc-4d','c0654f0b-8452-4a03-a43d-0d0cda17da1b','organisation.configuration_updated','{\"legal_name\":\"TRINU BONDED WAREHOUSE\",\"uploaded_files\":2}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-09 15:26:23'),('4a2c69c4-becb-418b-9bbb-9c4f2554f15e','d2beefba-e4bc-4d','c0654f0b-8452-4a03-a43d-0d0cda17da1b','organisation.document_uploaded','{\"document_id\":\"bbd99577-a3f4-4687-b40d-845c2de71144\",\"kind\":\"utility_bill\",\"file_name\":\"istockphoto-1289461335-612x612.jpg\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-09 14:39:19'),('53cbc286-a4e0-4534-907a-491b9c6002fd','d2beefba-e4bc-4d','c0654f0b-8452-4a03-a43d-0d0cda17da1b','organisation.document_uploaded','{\"document_id\":\"7954b1db-f871-48c7-82a1-96d47ce05c4b\",\"kind\":\"tin\",\"file_name\":\"CAC.jpg\"}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-09 14:24:56'),('e985d0e4-d47e-9159-41c9-3d741c5e60b9','d2beefba-e4bc-4d','c0654f0b-8452-4a03-a43d-0d0cda17da1b','organisation.configuration_updated','{\"legal_name\":\"TRINU BONDED WAREHOUSE\",\"uploaded_files\":0}','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-09 15:25:55');
/*!40000 ALTER TABLE `organisation_audit_logs` ENABLE KEYS */;
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
INSERT INTO `organisation_document_reviews` VALUES ('15a3e168-c25c-11f1-b11f-5081407ad051','476b6bbb-932c-43b4-9846-d9bf057b9a77','6540d4e1-2545-48e7-8671-02a7eba57610','approved',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:38','2026-10-07 14:33:38','2026-10-07 14:33:38'),('15a3ea5f-c25c-11f1-b11f-5081407ad051','59b0835d-ee9f-43c1-8cf3-00a67dd9eb5e','6540d4e1-2545-48e7-8671-02a7eba57610','approved',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:38','2026-10-07 14:33:38','2026-10-07 14:33:38'),('15a3f0ea-c25c-11f1-b11f-5081407ad051','8492c69c-431c-411f-b90a-ad2c9e10da0b','6540d4e1-2545-48e7-8671-02a7eba57610','approved',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:38','2026-10-07 14:33:38','2026-10-07 14:33:38'),('15a3f73c-c25c-11f1-b11f-5081407ad051','d5399b12-4eb2-4d16-9b20-24e59817f784','6540d4e1-2545-48e7-8671-02a7eba57610','approved',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:38','2026-10-07 14:33:38','2026-10-07 14:33:38'),('15a3fc8f-c25c-11f1-b11f-5081407ad051','f540a7ce-914a-4d1e-853d-634861c5de67','6540d4e1-2545-48e7-8671-02a7eba57610','approved',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:38','2026-10-07 14:33:38','2026-10-07 14:33:38'),('1d287255-c25c-11f1-b11f-5081407ad051','54501249-897a-4d21-a315-647e9687510e','eee3288a-4560-46e2-a957-31db1b0d8c73','approved',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:50','2026-10-07 14:33:50','2026-10-07 14:33:50'),('1d287aa1-c25c-11f1-b11f-5081407ad051','739a8695-8948-4064-b9d4-ad16c439576d','eee3288a-4560-46e2-a957-31db1b0d8c73','approved',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:50','2026-10-07 14:33:50','2026-10-07 14:33:50'),('1d288263-c25c-11f1-b11f-5081407ad051','7ae81cb1-5590-4693-b1ce-982cfddef2c4','eee3288a-4560-46e2-a957-31db1b0d8c73','approved',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:50','2026-10-07 14:33:50','2026-10-07 14:33:50'),('1d28ffa0-c25c-11f1-b11f-5081407ad051','ae93afa7-f5e1-4aa7-a4c7-915e91a49576','eee3288a-4560-46e2-a957-31db1b0d8c73','approved',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:50','2026-10-07 14:33:50','2026-10-07 14:33:50'),('1d2908cf-c25c-11f1-b11f-5081407ad051','be191640-1517-43e8-b72c-29ac830c9206','eee3288a-4560-46e2-a957-31db1b0d8c73','approved',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:50','2026-10-07 14:33:50','2026-10-07 14:33:50'),('1d2911ba-c25c-11f1-b11f-5081407ad051','c49d989c-ea00-4446-8584-18b3e876c078','eee3288a-4560-46e2-a957-31db1b0d8c73','approved',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:50','2026-10-07 14:33:50','2026-10-07 14:33:50'),('1d291c52-c25c-11f1-b11f-5081407ad051','d639d935-b164-4e13-8eaa-dc507429ebe6','eee3288a-4560-46e2-a957-31db1b0d8c73','approved',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:50','2026-10-07 14:33:50','2026-10-07 14:33:50'),('4f1c1b20-6ff6-f096-bb49-909ce4204c2a','088c76ac-32e6-f93c-b2f2-fd86ceab7b5b','d2beefba-e4bc-4d','pending',NULL,NULL,NULL,'2026-10-09 15:26:23','2026-10-09 15:26:23'),('65ed4777-f0e7-451d-afd7-5d9c9b6fb60c','fedfbab6-7cdd-4e1d-831c-4671ce979d14','0a91a3fc-c629-45a7-a246-70bde778408d','approved',NULL,NULL,'2026-10-02 12:55:38','2026-10-01 16:55:26','2026-10-02 10:55:38'),('90cd4f78-bdc2-11f1-a42e-5081407ad051','291577ed-5a9b-4013-8a2c-3f5b0fc180d7','0a91a3fc-c629-45a7-a246-70bde778408d','approved',NULL,NULL,'2026-10-02 12:55:38','2026-10-01 17:04:37','2026-10-02 10:55:38'),('90cdafe4-bdc2-11f1-a42e-5081407ad051','93f51ad8-2c1d-4054-80df-8d5f77d8f93f','0a91a3fc-c629-45a7-a246-70bde778408d','approved',NULL,NULL,'2026-10-02 12:55:38','2026-10-01 17:04:37','2026-10-02 10:55:38'),('90cdb7bd-bdc2-11f1-a42e-5081407ad051','d7c15eb3-63c1-4f4c-86ca-a51e2ad7ac3f','0a91a3fc-c629-45a7-a246-70bde778408d','approved',NULL,NULL,'2026-10-02 12:55:38','2026-10-01 17:04:37','2026-10-02 10:55:38'),('90cdbea1-bdc2-11f1-a42e-5081407ad051','f9a88e37-a6e0-4a9a-baf5-63029389d1eb','0a91a3fc-c629-45a7-a246-70bde778408d','approved',NULL,NULL,'2026-10-02 12:55:38','2026-10-01 17:04:37','2026-10-02 10:55:38'),('b49e70ad-bdb4-11f1-a42e-5081407ad051','389843a6-bcdc-4ae1-83b4-4f7ec11f54b2','0a91a3fc-c629-45a7-a246-70bde778408d','approved',NULL,NULL,'2026-10-02 12:55:38','2026-10-01 15:25:24','2026-10-02 10:55:38'),('b589dbc9-bf2f-11f1-9ab1-5081407ad051','445936fe-92c2-45d5-8f12-c44d54a5c3c4','6540d4e1-2545-48e7-8671-02a7eba57610','approved',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:38','2026-10-03 13:38:25','2026-10-07 14:33:38'),('d85134f7-093b-4ac6-a5ef-f2eaa1f80edc','bbd99577-a3f4-4687-b40d-845c2de71144','d2beefba-e4bc-4d','pending',NULL,NULL,NULL,'2026-10-09 14:39:19','2026-10-09 14:39:19'),('e32b83ac-2f68-8bcf-7e1f-3836a859d086','84d9a23a-a33f-3b74-79da-5aa04faa7703','d2beefba-e4bc-4d','pending',NULL,NULL,NULL,'2026-10-09 15:26:23','2026-10-09 15:26:23'),('e46cb78e-155e-4ebe-ba96-495490c1b784','397d1077-fce9-4b33-8cb0-c96e11d3ace9','6540d4e1-2545-48e7-8671-02a7eba57610','approved',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:38','2026-10-07 14:33:18','2026-10-07 14:33:38'),('f14d2ad1-8c34-4f31-bb2c-a5ff250e305c','7954b1db-f871-48c7-82a1-96d47ce05c4b','d2beefba-e4bc-4d','pending',NULL,NULL,NULL,'2026-10-09 14:24:56','2026-10-09 14:24:56');
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
INSERT INTO `organisation_members` VALUES ('3db7d60a-da4f-4ce3-9cc4-918982185568','0a91a3fc-c629-45a7-a246-70bde778408d','ff20dfcf-f843-4cd3-a263-412210683de9','183874f2-bc37-11f1-bb55-5081407ad051','CEO','active',NULL,'2026-10-01 19:04:37','2026-10-01 13:33:18'),('57c12831-706a-4870-8c33-85a117218624','d2beefba-e4bc-4d','2c1cb0a6-1b1b-4fb0-9dd0-025765bb5046','1838775d-bc37-11f1-bb55-5081407ad051',NULL,'revoked','e4d5623b-c569-4ac9-ba75-9bdd7968a70b',NULL,'2026-10-07 17:51:03'),('69f23005-45c5-4a0a-8ac9-2f5688caf7c3','6540d4e1-2545-48e7-8671-02a7eba57610','4a9ba8d5-93b6-4b65-af96-934920afcd18','183874f2-bc37-11f1-bb55-5081407ad051','dscsd','active',NULL,'2026-10-07 15:33:38','2026-10-03 13:22:00'),('8e2420fd-687f-42ea-9fbf-d8d974d7a3e3','eee3288a-4560-46e2-a957-31db1b0d8c73','53698470-56d3-4848-b65c-097021bd2823','183874f2-bc37-11f1-bb55-5081407ad051','IT manager','active',NULL,'2026-10-07 15:33:50','2026-10-03 11:20:51'),('b024eb17-bf1d-11f1-9ab1-5081407ad051','d2beefba-e4bc-4d','c0654f0b-8452-4a03-a43d-0d0cda17da1b','18386d94-bc37-11f1-bb55-5081407ad051','Admin','active',NULL,'2026-10-03 12:25:37','2026-10-03 11:29:25');
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
  `date_of_incorporation` date DEFAULT NULL,
  `sector` varchar(150) DEFAULT NULL,
  `registered_address` text DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `organisation_type` enum('terminal','importer','agent') NOT NULL,
  `verification_status` enum('pending','under_review','verified','rejected','suspended') NOT NULL DEFAULT 'pending',
  `verified_by` char(36) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `trading_name` varchar(255) DEFAULT NULL,
  `operating_address` text DEFAULT NULL,
  `contact_email` varchar(254) DEFAULT NULL,
  `contact_phone` varchar(25) DEFAULT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `contact_person_title` varchar(150) DEFAULT NULL,
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
INSERT INTO `organisations` VALUES ('0a91a3fc-c629-45a7-a246-70bde778408d','Atlantic Trade PLC','RC-93749834','343434343',NULL,NULL,NULL,NULL,'importer','verified','682f7cf2-b05f-4c','2026-10-02 12:55:38',NULL,'2026-10-01 13:33:18','2026-10-02 10:55:38',NULL,NULL,NULL,NULL,NULL,NULL),('6540d4e1-2545-48e7-8671-02a7eba57610','Trade Plc','RC-3782367','93923792','1888-02-12','Food & Beverage','sdsdsd sdsd',NULL,'importer','verified','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:38',NULL,'2026-10-03 13:22:00','2026-10-07 14:33:38',NULL,NULL,NULL,NULL,NULL,NULL),('d2beefba-e4bc-4d','TRINU BONDED WAREHOUSE','RC-2555656565','61561651615',NULL,'Healthcare & Pharmaceuticals','','','terminal','verified',NULL,NULL,NULL,'2026-09-29 11:56:20','2026-10-09 15:26:23','','','','','',''),('eee3288a-4560-46e2-a957-31db1b0d8c73','JeoDan Trading Corporations','RC-1428932','2243243423',NULL,NULL,NULL,NULL,'importer','verified','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:33:50',NULL,'2026-10-03 11:20:51','2026-10-07 14:33:50',NULL,NULL,NULL,NULL,NULL,NULL);
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
INSERT INTO `otp_codes` VALUES ('02974946-2ca9-4435-ab07-099c7d956c49','c0654f0b-8452-4a03-a43d-0d0cda17da1b','$2y$10$ah5HgSi64A/QGjP8aB1UFegwSgJTx1x0g/5azuIS3egevfoSzS7s6','a64d441640c985829525532c217c9e8f9695b44211884296727ff3379b3ee9d1','email','hqfdevelopers@gmail.com','login_mfa',0,5,0,'2026-10-08 18:25:55','2026-10-08 18:30:55',NULL,'2026-10-08 18:26:03',NULL,'2026-10-08 17:25:55'),('0b9d543d-43c1-41c6-90ab-e327e7b60c09','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$pvLmThekM25J7b4LkZb8ce2RZw9IFXW5PS7tVkrkscWfu0M3/EQcm','2c065134c78d03adafc99173ee807f2422974cd047d6a9877f63e7f33828cc9a','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-05 18:29:45','2026-10-05 18:34:45',NULL,'2026-10-05 18:29:45',NULL,'2026-10-05 17:29:45'),('137b65ea-2f65-4ddf-aa0d-e4b3be85ce50','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$lXoEsu.jFki76S.HRJJTWukXSg5zA.LCzI1Q4ish2cRQPn5Diskvi','49b5626ec2ce210e764b074cc4ecb864d8b671aa44560b6ab83c1b9959f1d784','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-05 18:30:05','2026-10-05 18:35:05',NULL,'2026-10-05 18:30:05',NULL,'2026-10-05 17:30:05'),('145c2a6a-044f-4e9b-8372-b0ecaa5292a0','e4d5623b-c569-4ac9-ba75-9bdd7968a70b','$2y$10$/9llVD8x7pBIvDbHAvx0LuzOIo7RdAc/jTiqt9SaAriDLY4ZKdo.q',NULL,'sms','08083654765','phone_verify',0,5,2,'2026-10-07 17:49:44','2026-10-07 17:59:44',NULL,'2026-10-07 17:50:03',NULL,'2026-10-07 16:49:44'),('1523772b-3036-447e-b541-245163323563','c0654f0b-8452-4a03-a43d-0d0cda17da1b','$2y$10$9korQO4.ZBEh2dFqK7ymgOHrw0tq1Rq8ZXu1ubtcq6FA24dWX.KqK','408c0fa782e1cd7ea54ab0fd5efd8693f798760504f38d4bbcbae9f12123d75f','email','hqfdevelopers@gmail.com','login_mfa',0,5,0,'2026-10-07 14:20:06','2026-10-07 14:25:06',NULL,'2026-10-07 14:20:06',NULL,'2026-10-07 13:20:06'),('18efe9d9-a4e9-428b-9059-cb255fdbb90c','ff20dfcf-f843-4cd3-a263-412210683de9','$2y$10$zEe.pgy/2odu3.4YYQXD3OVfKtGsDFaW3AeP//ioMgZHPhoL0n64i','99998b587986bcecbacbbc35d9b0d2027a22d780f2224cc9026309c839b8b855','email','d.stone.david@gmail.com','login_mfa',0,5,0,'2026-10-01 18:17:21','2026-10-01 18:22:21','2026-10-01 18:17:51',NULL,'127.0.0.1','2026-10-01 16:17:21'),('2243c017-7f01-4f48-a3df-148924ec4d1a','e4d5623b-c569-4ac9-ba75-9bdd7968a70b','$2y$10$j3JRNpu1Aex3sPaOAAfZO.hUAqJrpA8hqVMuJFP6OKCwEgKth8jA2',NULL,'sms','08083654765','phone_verify',0,5,1,'2026-10-07 17:46:21','2026-10-07 17:56:21',NULL,'2026-10-07 17:49:44',NULL,'2026-10-07 16:46:21'),('270c79e8-8525-420d-a2ce-bbf08db9f28e','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$8/xw5Auq9dWW8RgmBGNUMevPyQbXNCvSVRu.tleWhXqCEltjTvu9S','86839171c7a24b98a6a6592ccfae6a0c7ea4201bc3b77fb4d663090fbb9490b3','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 15:33:37','2026-10-03 15:38:37',NULL,'2026-10-03 15:33:58',NULL,'2026-10-03 14:33:37'),('2c4a52a0-c040-4ced-9c59-41f25d76be4a','ff20dfcf-f843-4cd3-a263-412210683de9','$2y$10$81esTXchsE89chvLKWpy1uv3Szv6w8Lp.8r6A6COFUuMOqPaXdZae','2a22480839513c9f51a4e1a8017bbab4e4ffd4190250d090f9ebb824dc9e497a','email','d.stone.david@gmail.com','login_mfa',0,5,0,'2026-10-03 11:25:41','2026-10-03 11:30:41','2026-10-03 11:26:14',NULL,'::1','2026-10-03 10:25:41'),('2ff05730-9a03-4313-8ac0-5459110b6425','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$6O60Ewa6lDLICMRZFbnMieJRxQQ/k6oDSnRp/cuA657mq81APfFHW','22e8bb3a15b5c2f555d6bafc761c68712b36b06eea423a3ee8846462a914ae27','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 15:35:06','2026-10-03 15:40:06',NULL,'2026-10-03 15:35:27',NULL,'2026-10-03 14:35:06'),('32af97a3-9abf-4873-8572-d36782f3bcac','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$hWf0F./RpKQTgZW.fnOZGOk1ZitNOufewn0gIv8CI8oCSziODBhX.','b7c99ab4cba04e337a84e0252417d14b0a24f75523b334f80e1a4e75561b28e5','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 15:29:51','2026-10-03 15:34:51','2026-10-03 15:30:23',NULL,NULL,'2026-10-03 14:29:51'),('440818c9-b5df-42b1-9615-5d61cf737f52','e4d5623b-c569-4ac9-ba75-9bdd7968a70b','$2y$10$ObqY52b9Jen8abclIetTgug9mzWMgf4J0PmE9SdMdTOdR72gCWGNy',NULL,'sms','08083654765','phone_verify',0,5,2,'2026-10-07 16:26:00','2026-10-07 16:36:00',NULL,'2026-10-07 16:33:39',NULL,'2026-10-07 15:26:00'),('459ff83d-b7d6-48bf-960d-5e78ab9d4bf3','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$2ttjeYBnyG45i/9l1Qc4CecEatiGcZ25xG4BHt82.r8uwVkroctqi','d43e8377c3dcb3d2c98bccdfbc2d9fcc28fac69554f9968138b8629d83032c91','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 15:04:00','2026-10-03 15:09:00',NULL,'2026-10-03 15:04:21',NULL,'2026-10-03 14:04:00'),('4c675d81-6862-4600-be46-b57e9f389975','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$duYad.hOn9UbPqxUG4EsH.advVV4DN6kIujwuBYR0heQ3UaQOm5RW','9bb48b71c5971f2a59c6a1f06ac2b9ba2d23faae091cabe23770896c102f9e8d','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 14:44:29','2026-10-03 14:49:29','2026-10-03 14:46:01',NULL,NULL,'2026-10-03 13:44:29'),('4e1e5df5-797e-43ee-8b62-1b50afbc0d00','ff20dfcf-f843-4cd3-a263-412210683de9','$2y$10$8n4Q1499NODkY0MzkP5cFuV.wrMkQuV9H6LvAFkCHtUBMT1kQKQwK','73cb44b23b4c89d1cfad82da5665d05aba780fce901fe51b008623044df0ad50','email','d.stone.david@gmail.com','login_mfa',0,5,0,'2026-10-03 11:16:16','2026-10-03 11:21:16','2026-10-03 11:17:01',NULL,'::1','2026-10-03 10:16:16'),('5017730d-cb7a-499d-93c7-ccfc1ef25cc9','e4d5623b-c569-4ac9-ba75-9bdd7968a70b','$2y$10$omRZvJOsm8pPVO7BkOuWBeKnOjpT72NvMkqgyXGWPIwsFHFB8j/12',NULL,'sms','08083654765','phone_verify',0,5,0,'2026-10-07 17:50:03','2026-10-07 18:00:03','2026-10-07 17:51:09',NULL,NULL,'2026-10-07 16:50:03'),('579edbc8-258b-4896-92bd-16e60af57b39','e4d5623b-c569-4ac9-ba75-9bdd7968a70b','$2y$10$8X7UnNrEP2vEr5vpRBemjujQ9jHeYTEM.JSf2rOOi/odhJg0M0/22','99d11fb2a5c35210bab056a6e1efd0f5a8cca65723aecbad0a0ec9ba53d99a5e','email','lovebiteonline4@gmail.com','login_mfa',0,5,0,'2026-10-07 18:02:25','2026-10-07 18:07:25','2026-10-07 18:02:45',NULL,NULL,'2026-10-07 17:02:25'),('5f1a2c11-3c1c-49fa-ad57-a5ebcd71f697','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$cPfAsy5PQdxCxv0HyY7oPeRGt88U/vfEY0YuvIwTbKY.u0PusE8wy','12b86949ab547ca0a6ee5b290be61135891512dc485f943cc0895407ff9c274a','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 16:13:58','2026-10-03 16:18:58',NULL,'2026-10-03 16:14:19',NULL,'2026-10-03 15:13:58'),('5ff53944-60fd-4be2-b764-29d9935fab2e','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$EpL9TliHvDsarS2czwLr1eTMxk6xPUI3S2Lo.n8bF0xj/OmTrJQ1S','c25e192c4a3ead5c2bcc63c878df04a2b382d259fd5d08974b4fae5539da2171','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 15:10:11','2026-10-03 15:15:11',NULL,'2026-10-03 15:10:32',NULL,'2026-10-03 14:10:11'),('6501d8ba-fbd2-4617-a8a6-6f7b79edcfe1','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$kugoJQXGdfeIJH8PVzgo1.NLyOqKsDM0YuZV7TDdaFABpvyeR1Ucy','bb1be0feb0f4f7aec85bae7fbce705a3034acfca995dc3895ee0a71849a40cb4','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 15:37:12','2026-10-03 15:42:12',NULL,'2026-10-03 15:37:33',NULL,'2026-10-03 14:37:12'),('7cfeeb08-8bee-4c45-9186-6cd631b29230','2c1cb0a6-1b1b-4fb0-9dd0-025765bb5046','$2y$10$r4EJ.UCvobn9Zq4xJZ2aq.kqrPDYOhWRZDYWxRnDJxEWa2STonh4i',NULL,'sms','08083654765','phone_verify',0,5,0,'2026-10-07 18:54:59','2026-10-07 19:04:59','2026-10-07 18:55:36',NULL,NULL,'2026-10-07 17:54:59'),('81229914-4089-4a08-9762-4dd747439298','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$6fa9ExRXX4M17lH1rME2Fu4yUk62lwfgnL//7TeBlXfmxn5/pyRvm','80c8127100ee5ca7c16adbf37bdb5f65d284e5813759ffee9d33cfe79457f418','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 14:43:57','2026-10-03 14:48:57',NULL,'2026-10-03 14:43:57',NULL,'2026-10-03 13:43:57'),('83085037-0312-40f3-ad24-bbd189a31254','ff20dfcf-f843-4cd3-a263-412210683de9','$2y$10$vylZ0pZW52.5/OHo93P91usBSUctNCz2gCwz7EjL6odVhBa5DcfE2',NULL,'email','d.stone.david@gmail.com','login_mfa',0,5,1,'2026-10-01 18:00:29','2026-10-01 18:05:29','2026-10-01 18:00:50',NULL,'127.0.0.1','2026-10-01 16:00:29'),('907cfc0f-0d4c-4c67-b4dd-b2ae7fe5554a','c0654f0b-8452-4a03-a43d-0d0cda17da1b','$2y$10$oC5GxA478ELYuFFBVUty6OfxfkjxFgPHKefJxf7JdERWHGDUEBle6','7db1774b6d16b0b2e5ad18764a2fcf64a4459aeb371748418c1f267cefdb2ec2','email','hqfdevelopers@gmail.com','login_mfa',0,5,0,'2026-10-07 14:25:17','2026-10-07 14:30:17',NULL,'2026-10-07 14:27:37',NULL,'2026-10-07 13:25:17'),('9422d312-37ae-4af8-86b5-8a079badc021','c0654f0b-8452-4a03-a43d-0d0cda17da1b','$2y$10$kPECbDronbax1DlH7G2a.uB9GpVjtaDDS2zM64zE8rlng.lRwJPFK','b4c2b2820cfd73bb3ecd9b39530b83cc75e9a794fd85d2b87b632e0e47f4ac2a','email','hqfdevelopers@gmail.com','login_mfa',0,5,0,'2026-10-08 19:18:13','2026-10-08 19:23:13','2026-10-08 19:18:35',NULL,NULL,'2026-10-08 18:18:13'),('96bd5e2b-b4b3-4d6b-a4c7-991b685a86e7','c0654f0b-8452-4a03-a43d-0d0cda17da1b','$2y$10$P4WPMBhaC2TrpmTFyKD0z.nNSzXLMN3TVd4vyXJra9aYefTTI.xWa','4a396537fab97fc20735207c1cf93355fb8cd211dca38aa54da584c0a3d25e8c','email','hqfdevelopers@gmail.com','login_mfa',0,5,0,'2026-10-03 12:29:31','2026-10-03 12:34:31',NULL,'2026-10-03 12:34:49','::1','2026-10-03 11:29:31'),('9ce8ee81-f2ec-4133-8d55-717b786b8fbb','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$ni.15.iZng3aVmtERAvglumBFIkYjy/C9rHOJEDybL.ZdK9JzA54W','881b5ad1e624631d1796d6e43c5fcd84efbab691f9ec00990ca7718f51cfc137','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-07 15:16:39','2026-10-07 15:21:39','2026-10-07 15:17:14',NULL,NULL,'2026-10-07 14:16:39'),('9e1d22b2-1b42-40a1-87bf-ba24d5a3a01d','c0654f0b-8452-4a03-a43d-0d0cda17da1b','$2y$10$Gt8EJo0k9bXPEnBy3rNn8u/O1cHI6atHT19N6M.Ke9ewPRESPuf.C','86f36a8ff829de70faab544f44dadcb4a3c53fdba5f3e2ca1cabd9703da278ce','email','hqfdevelopers@gmail.com','login_mfa',0,5,0,'2026-10-08 15:05:01','2026-10-08 15:10:01',NULL,'2026-10-08 15:05:03',NULL,'2026-10-08 14:05:01'),('9f3e9c54-fa06-45c3-ab4d-c42fe0a6ba64','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$ko3L0HawzkOMG5HYL/7hduxOis6FxsL1e9nE5LdHqfxkU1O8YkgXm','5a8cb0accba4d92c09d121610bb6916500878399a4985b6d1e469598db79bd1f','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 15:33:12','2026-10-03 15:38:12',NULL,'2026-10-03 15:33:33',NULL,'2026-10-03 14:33:12'),('a1c1c4ce-e3da-49cd-91d5-dbeec2ac8d8e','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$7A.Arb7WgOflXhoWOmSKKuDI.GXT0qy5p1aJqtPzioA9PDSfAfvba','066120b86c3795da4d4ed691d47fb4c8264079e4f27505ad6ee43730418a1a7d','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 16:03:13','2026-10-03 16:08:13',NULL,'2026-10-03 16:03:34',NULL,'2026-10-03 15:03:13'),('a28b2b75-734f-4088-b8f8-011bffefd514','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$BZnPKzPqcStRJMEqhCtorehDVhtMRLfev269JM96gjtc15Ghl/fYq','637fd875b5bb6818c80e815caa1bd643ead8550f3da219fd14aea37eba033467','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 16:18:50','2026-10-03 16:23:50',NULL,'2026-10-03 16:19:11',NULL,'2026-10-03 15:18:50'),('ac987477-f5d3-41f2-ba3e-a3ab587e0c6f','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$cHVHt04VAm35P4uhoygeD.ez3lhxRunheH/.KDJqfpNUcer7ImRxS','1bcf2449592d83b8ec0a5b71bbf33c9493e0245a7cf7654c99b307f2648bd041','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 15:01:16','2026-10-03 15:06:16','2026-10-03 15:01:42',NULL,NULL,'2026-10-03 14:01:16'),('acbe4f1d-7af1-40a4-802c-5218005b496a','c0654f0b-8452-4a03-a43d-0d0cda17da1b','$2y$10$517JOR0OP2NL0UYZgsRzEe1ZW0A./FOSX9XX/EufippyqwjQ7irWe',NULL,'email','hqfdevelopers@gmail.com','login_mfa',0,5,1,'2026-10-08 18:52:27','2026-10-08 18:57:27','2026-10-08 18:53:05',NULL,'::1','2026-10-08 17:52:27'),('ad01336d-a96a-49ef-8d52-9ee536295e50','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$zIzSCC5f5x57dPpF0/RZwOpuuug3oV5O6fAsAaozgMLmiMKPguiaC','323a0fada3601e9ff3c27647d083bbf7948dcb1983516ae7cb588afe624bbc49','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 14:59:49','2026-10-03 15:04:49',NULL,'2026-10-03 15:00:10',NULL,'2026-10-03 13:59:49'),('b31f3022-20bf-4393-80eb-4929bf96c91e','c0654f0b-8452-4a03-a43d-0d0cda17da1b','$2y$10$R3uZC4fCG956AU34hCWbVugl.HAsVW0peCVs6sDbezJz2m.3S0KLu','e6b72b47bd7264da1e9319a6493710ab613622cee8aa50576e7d322547683c2d','email','hqfdevelopers@gmail.com','login_mfa',0,5,0,'2026-10-07 14:27:37','2026-10-07 14:32:37','2026-10-07 14:30:28',NULL,NULL,'2026-10-07 13:27:37'),('b54e756f-d20b-4bca-b1d4-51fc156eee07','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$oNysP13169N5.1dG5IpDjOSm8l3CIPez.lKiU.TGY0BELLOi5adBi','b96f110de4cdaed325d22938d7e17537247de233c8315c9c02381c5f854a0a08','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 16:17:06','2026-10-03 16:22:06',NULL,'2026-10-03 16:17:27',NULL,'2026-10-03 15:17:06'),('bac0de71-de37-4d09-a8fc-ed0859e9ba71','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$B5d47mfxljJoHjAR8aMh.uLVUUeQC1BMElMNhrqJqTvRT6AqsBOL2','1efbc4276374a4a129132e975abfbdecdcc0aaba17cf1b34ea3e0980e1fbc4a5','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 15:03:04','2026-10-03 15:08:04',NULL,'2026-10-03 15:03:25',NULL,'2026-10-03 14:03:04'),('bbed7e78-dbf9-47ae-a697-36a9ed701071','e4d5623b-c569-4ac9-ba75-9bdd7968a70b','$2y$10$9SytpEfuDrg/fsrzOuTYyeiDmJzMIEriJ7LjZOIH9fa9YT820MNc6',NULL,'sms','08164902529','phone_verify',0,5,1,'2026-10-07 16:24:08','2026-10-07 16:34:08',NULL,'2026-10-07 16:26:00',NULL,'2026-10-07 15:24:08'),('bf7c627a-4bb9-48f1-acbf-5a5358be6562','c0654f0b-8452-4a03-a43d-0d0cda17da1b','$2y$10$/wllTtbePRAS8gKwzCNaK.X0BICCEbJleCAFaPr0SmwfS92jYKjba','c914bd6a041809feb3b3203c982ec617ad5368a22a22acf708a74ca752d01dc9','email','hqfdevelopers@gmail.com','login_mfa',0,5,0,'2026-10-07 14:19:22','2026-10-07 14:24:22',NULL,'2026-10-07 14:19:22',NULL,'2026-10-07 13:19:22'),('cb488d95-6ba0-4ab1-a0ae-01facb6c45c1','ff20dfcf-f843-4cd3-a263-412210683de9','$2y$10$/kxz/EZNpxUXxyP9ogkDV.Km1pCgNSiAXQfIZco7UAZSWG8ZYzPJq','50504597414772a6752114cd0e1ff37aebbaa503a02b1fd92afef88b9b920629','email','d.stone.david@gmail.com','login_mfa',0,5,0,'2026-10-02 12:51:54','2026-10-02 12:56:54','2026-10-02 12:53:24',NULL,'127.0.0.1','2026-10-02 10:51:54'),('d1e1d449-410d-47f4-b58f-cb4bdbc928e1','c0654f0b-8452-4a03-a43d-0d0cda17da1b','$2y$10$YBgoNQ3kqOHF0ug8SognHOmK7HZaArdAUhTgnUwigPHFDQwpKVmbu','a2bce394d1395fba9f7a17e62f8fb69192411d6563e5c103fa7f2184e5fbbf05','email','hqfdevelopers@gmail.com','login_mfa',0,5,0,'2026-10-08 18:36:02','2026-10-08 18:41:02',NULL,'2026-10-08 18:36:18',NULL,'2026-10-08 17:36:02'),('d95ea641-548b-47e7-a025-14fc1366051f','ff20dfcf-f843-4cd3-a263-412210683de9','$2y$10$i1.ObA3L.AOVwg3PW9fYA.995PffplPu0/hN8e6p0cAaClK2JG8Py','7b8fba71ff2540da8f3a7a67bf397447dbf0b00eab05c5115f34c4a121d68d92','email','d.stone.david@gmail.com','login_mfa',0,5,0,'2026-10-01 17:53:30','2026-10-01 17:58:30',NULL,'2026-10-01 17:59:47','127.0.0.1','2026-10-01 15:53:30'),('da077eb9-6aff-4bc1-9df8-1958e5a83ffe','e4d5623b-c569-4ac9-ba75-9bdd7968a70b','$2y$10$4UolwN00ECAvOoACxsbj6.roxRjok1acoprEC0hB4n.hClqH6ksDq',NULL,'sms','08164902529','phone_verify',0,5,0,'2026-10-07 16:21:10','2026-10-07 16:31:10',NULL,'2026-10-07 16:24:07',NULL,'2026-10-07 15:21:10'),('dacbc4ea-16bb-46d3-b005-486e9716f5da','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$Ur7vsk2YHfuPOQ4hynm5peQMiMx25NYaiOmM0WxVMu9QIwNuqHtuG','5fd9617a8a1a4d8ad347fb505a48e13f3490e4ec07163e48aab560c4246c405c','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 15:32:10','2026-10-03 15:37:09','2026-10-03 15:32:30',NULL,NULL,'2026-10-03 14:32:10'),('defa66ae-a03e-41f2-9cb5-ec21dc905321','e4d5623b-c569-4ac9-ba75-9bdd7968a70b','$2y$10$NJsq/j8Auxgjl0to1hBS9O5aB.k9bIlNimAh.GO4YXaBVRzd58DdW',NULL,'sms','08083654765','phone_verify',0,5,0,'2026-10-07 16:33:39','2026-10-07 16:43:39',NULL,'2026-10-07 17:46:21',NULL,'2026-10-07 15:33:39'),('df6baff0-a97d-4fe1-b196-9de2569e48cb','ff20dfcf-f843-4cd3-a263-412210683de9','$2y$10$IWpJ/TPh9CWnAzvb4.B1Ie3i.nQSU3lin7WL68mhh/GdN7U8a90.G','75dc99e5e00c278793506d9c7aaf82aeaa8982b43b210404921bd3b160d6a303','email','d.stone.david@gmail.com','login_mfa',0,5,0,'2026-10-01 18:19:46','2026-10-01 18:24:46','2026-10-01 18:20:13',NULL,'127.0.0.1','2026-10-01 16:19:46'),('ef29007b-4d6e-4b4e-941d-ea93a7364f4d','4a9ba8d5-93b6-4b65-af96-934920afcd18','$2y$10$l9InB8cgXn/tBDb9XbYmGe/clDN3ATnXf.sdCm//P88P3LkjCY6wa','acf04303a838fc474be683fb46b33572260ffcb482db5db60995b21030dbb403','email','eloike92@gmail.com','login_mfa',0,5,0,'2026-10-03 15:00:25','2026-10-03 15:05:25',NULL,'2026-10-03 15:00:46',NULL,'2026-10-03 14:00:25'),('f3080b37-617e-4833-923d-1eb4cf91bf3e','c0654f0b-8452-4a03-a43d-0d0cda17da1b','$2y$10$qMzblBhnFY5xlmsrXLCJAuIbOYCNtfABph.9HdX6wu9wvhV4hUDsy','f0533b5d4055fc904b35e3dcf3bdd6225d42fc741d91d271d6f5b2c7b6ff14f0','email','hqfdevelopers@gmail.com','login_mfa',0,5,0,'2026-10-07 14:20:58','2026-10-07 14:25:58',NULL,'2026-10-07 14:25:17',NULL,'2026-10-07 13:20:58'),('f37a5466-7b1f-4761-90b1-6edc07c39516','c0654f0b-8452-4a03-a43d-0d0cda17da1b','$2y$10$wzaRfbPQMopvBd58Fa62ROyT66UMwcAmdTEci/84I.bm4oWxwBgBS','d9d469b850f7bc2859061d6d9f83ca7061b58ece61eaa9da678a49ba8da52264','email','hqfdevelopers@gmail.com','login_mfa',0,5,0,'2026-10-07 14:19:34','2026-10-07 14:24:34',NULL,'2026-10-07 14:19:34',NULL,'2026-10-07 13:19:34'),('f5946eb5-4c73-44a4-8111-68b727c1b1ba','c0654f0b-8452-4a03-a43d-0d0cda17da1b','$2y$10$fGYtYA2HzzvkK1knyv710ekNlidnAwX14Ngzdas5S/F.BhZNPb1qq',NULL,'email','hqfdevelopers@gmail.com','login_mfa',0,5,1,'2026-10-03 12:34:53','2026-10-03 12:39:53','2026-10-03 12:36:27',NULL,'::1','2026-10-03 11:34:53');
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
INSERT INTO `permissions` VALUES ('1838d8fb-bc37-11f1-bb55-5081407ad051','portal.view','portal','view','Access the stakeholder portal.','2026-09-29 16:53:45'),('1838defc-bc37-11f1-bb55-5081407ad051','portal.cargo','portal','cargo','View authorised cargo information.','2026-09-29 16:53:45'),('1838df69-bc37-11f1-bb55-5081407ad051','portal.documents','portal','documents','Access authorised documents.','2026-09-29 16:53:45'),('1838dfa3-bc37-11f1-bb55-5081407ad051','portal.financials','portal','financials','View authorised financial information.','2026-09-29 16:53:45'),('1838dfdd-bc37-11f1-bb55-5081407ad051','portal.requests','portal','requests','Create and manage authorised service requests.','2026-09-29 16:53:45'),('1838e013-bc37-11f1-bb55-5081407ad051','operations.view','operations','view','View terminal operations.','2026-09-29 16:53:45'),('1838e040-bc37-11f1-bb55-5081407ad051','operations.manage','operations','manage','Manage terminal operational workflows.','2026-09-29 16:53:45'),('1838e071-bc37-11f1-bb55-5081407ad051','operations.cargo','operations','cargo','Manage cargo receiving, movements and status workflows.','2026-09-29 16:53:45'),('1838e0a9-bc37-11f1-bb55-5081407ad051','operations.holds','operations','holds','Manage authorised holds and hold-related workflows.','2026-09-29 16:53:45'),('1838e0dd-bc37-11f1-bb55-5081407ad051','operations.examination','operations','examination','Manage examination scheduling and evidence capture without making Customs decisions.','2026-09-29 16:53:45'),('1838e115-bc37-11f1-bb55-5081407ad051','gate.view','gate','view','View gate operations and bookings.','2026-09-29 16:53:45'),('1838e144-bc37-11f1-bb55-5081407ad051','gate.bookings','gate','bookings','Manage vehicle and gate bookings.','2026-09-29 16:53:45'),('1838e174-bc37-11f1-bb55-5081407ad051','gate.admit','gate','admit','Perform authorised gate admission decisions.','2026-09-29 16:53:45'),('1838e1a4-bc37-11f1-bb55-5081407ad051','gate.refer','gate','refer','Refer gate movements with reasons.','2026-09-29 16:53:45'),('1838e1d8-bc37-11f1-bb55-5081407ad051','gate.reject','gate','reject','Reject gate movements with reasons.','2026-09-29 16:53:45'),('1838e20a-bc37-11f1-bb55-5081407ad051','gate.override','gate','override','Perform supervisor-authorised gate overrides.','2026-09-29 16:53:45'),('1838e23e-bc37-11f1-bb55-5081407ad051','gate.gate_out','gate','gate_out','Perform gate-out and release checks within assigned authority.','2026-09-29 16:53:45'),('1838e270-bc37-11f1-bb55-5081407ad051','warehouse.view','warehouse','view','View warehouse and yard information.','2026-09-29 16:53:45'),('1838e2a1-bc37-11f1-bb55-5081407ad051','warehouse.receive','warehouse','receive','Receive and tally cargo.','2026-09-29 16:53:45'),('1838e2d6-bc37-11f1-bb55-5081407ad051','warehouse.inventory','warehouse','inventory','Manage inventory counts and approved adjustments.','2026-09-29 16:53:45'),('1838e30e-bc37-11f1-bb55-5081407ad051','warehouse.position','warehouse','position','Position and relocate cargo.','2026-09-29 16:53:45'),('1838e347-bc37-11f1-bb55-5081407ad051','warehouse.pick','warehouse','pick','Pick cargo for authorised workflows.','2026-09-29 16:53:45'),('1838e37c-bc37-11f1-bb55-5081407ad051','documents.view','documents','view','View authorised documents.','2026-09-29 16:53:45'),('1838e3af-bc37-11f1-bb55-5081407ad051','documents.manage','documents','manage','Register and manage documents.','2026-09-29 16:53:45'),('1838e3e0-bc37-11f1-bb55-5081407ad051','documents.verify','documents','verify','Verify documents.','2026-09-29 16:53:45'),('1838e414-bc37-11f1-bb55-5081407ad051','documents.issue','documents','issue','Issue authorised terminal documents.','2026-09-29 16:53:45'),('1838e445-bc37-11f1-bb55-5081407ad051','finance.view','finance','view','View financial information.','2026-09-29 16:53:45'),('1838e477-bc37-11f1-bb55-5081407ad051','finance.tariffs','finance','tariffs','Manage tariffs and charging rules within authority.','2026-09-29 16:53:45'),('1838e4a9-bc37-11f1-bb55-5081407ad051','finance.invoices','finance','invoices','Manage invoices, credit notes and receipts within authority.','2026-09-29 16:53:45'),('1838e4db-bc37-11f1-bb55-5081407ad051','finance.payments','finance','payments','Manage payment records and payment confirmation workflows.','2026-09-29 16:53:45'),('1838e50a-bc37-11f1-bb55-5081407ad051','finance.reconciliation','finance','reconciliation','Perform payment and bank reconciliation.','2026-09-29 16:53:45'),('1838e53a-bc37-11f1-bb55-5081407ad051','finance.collections','finance','collections','Manage collections, ageing and dunning workflows.','2026-09-29 16:53:45'),('1838e56b-bc37-11f1-bb55-5081407ad051','finance.adjustments','finance','adjustments','Manage authorised financial adjustments, discounts and waivers.','2026-09-29 16:53:45'),('1838e59a-bc37-11f1-bb55-5081407ad051','reports.view','reports','view','View role-scoped reports.','2026-09-29 16:53:45'),('1838e5c9-bc37-11f1-bb55-5081407ad051','reports.export','reports','export','Export role-scoped reports.','2026-09-29 16:53:45'),('1838e5fa-bc37-11f1-bb55-5081407ad051','reports.management','reports','management','Access management reporting and analytics.','2026-09-29 16:53:45'),('1838e62d-bc37-11f1-bb55-5081407ad051','customer_service.view','customer_service','view','View customer service and sales records.','2026-09-29 16:53:45'),('1838e65c-bc37-11f1-bb55-5081407ad051','customer_service.manage','customer_service','manage','Manage customer service workflows.','2026-09-29 16:53:45'),('1838e68d-bc37-11f1-bb55-5081407ad051','customer_service.quotes','customer_service','quotes','Manage enquiries and quotations.','2026-09-29 16:53:45'),('1838e6c1-bc37-11f1-bb55-5081407ad051','customer_service.onboarding','customer_service','onboarding','Manage KYC and onboarding workflows.','2026-09-29 16:53:45'),('1838e6fa-bc37-11f1-bb55-5081407ad051','compliance.view','compliance','view','View compliance and Customs liaison records.','2026-09-29 16:53:45'),('1838e72a-bc37-11f1-bb55-5081407ad051','compliance.manage','compliance','manage','Manage compliance workflows and authorised Customs references.','2026-09-29 16:53:45'),('1838e75b-bc37-11f1-bb55-5081407ad051','compliance.audit','compliance','audit','Prepare authorised audit and compliance responses.','2026-09-29 16:53:45'),('1838e78b-bc37-11f1-bb55-5081407ad051','management.dashboard','management','dashboard','Access management dashboards.','2026-09-29 16:53:45'),('1838e7d5-bc37-11f1-bb55-5081407ad051','management.reports','management','reports','Access management reports and analytics.','2026-09-29 16:53:45'),('1838e809-bc37-11f1-bb55-5081407ad051','administration.users','administration','users','Manage users and memberships.','2026-09-29 16:53:45'),('1838e83b-bc37-11f1-bb55-5081407ad051','administration.roles','administration','roles','Manage roles.','2026-09-29 16:53:45'),('1838e86a-bc37-11f1-bb55-5081407ad051','administration.permissions','administration','permissions','Manage permissions and role assignments.','2026-09-29 16:53:45'),('1838e89f-bc37-11f1-bb55-5081407ad051','administration.configuration','administration','configuration','Manage designated business configuration.','2026-09-29 16:53:45'),('1838e8d6-bc37-11f1-bb55-5081407ad051','administration.audit','administration','audit','View and export audit records.','2026-09-29 16:53:45'),('1838e909-bc37-11f1-bb55-5081407ad051','administration.feature_flags','administration','feature_flags','Manage feature flags and maintenance controls.','2026-09-29 16:53:45'),('1838e93f-bc37-11f1-bb55-5081407ad051','administration.integrations','administration','integrations','Manage integration configuration and operational controls.','2026-09-29 16:53:45'),('1838e977-bc37-11f1-bb55-5081407ad051','system.organisations','system','organisations','Manage and view all organisations.','2026-09-29 16:53:45'),('1838e9a8-bc37-11f1-bb55-5081407ad051','system.users','system','users','Manage users across the platform.','2026-09-29 16:53:45'),('1838e9dc-bc37-11f1-bb55-5081407ad051','system.roles','system','roles','Manage platform roles and permissions.','2026-09-29 16:53:45'),('1838ea93-bc37-11f1-bb55-5081407ad051','system.audit','system','audit','View platform-wide audit information.','2026-09-29 16:53:45'),('1838ead1-bc37-11f1-bb55-5081407ad051','system.configuration','system','configuration','Manage platform-wide configuration.','2026-09-29 16:53:45');
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
  `registration_request_id` char(36) DEFAULT NULL,
  `document_type` enum('cac','tin','signatory_id','licence','directors_list','utility_bill','other') NOT NULL,
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
INSERT INTO `registration_documents` VALUES ('088c76ac-32e6-f93c-b2f2-fd86ceab7b5b',NULL,'licence','ncs_customs_agent','sdsd','uploads/87a6d8cbd3b9ae3cff09e9b657725233f247faf12bd8bdc9.pdf','JeoDan_Trading_Corporations_Directors_Shareholders.pdf','application/pdf',3813,'2026-10-09 15:26:23'),('291577ed-5a9b-4013-8a2c-3f5b0fc180d7','a6567683-4fd3-4513-9205-d464aeec0b2f','licence','nafdac','32323','uploads/4c24ac1faf2026_10_01_03_33_18ages.jpg','images.jpg','image/jpeg',30816,'2026-10-01 13:33:18'),('389843a6-bcdc-4ae1-83b4-4f7ec11f54b2','a6567683-4fd3-4513-9205-d464aeec0b2f','licence','son','23232','uploads/a3e3f455e82026_10_01_03_33_18NCAP.png','SONCAP.png','image/png',65868,'2026-10-01 13:33:18'),('397d1077-fce9-4b33-8cb0-c96e11d3ace9','3de67ef0-f8fb-4f11-bf1e-9e43108f6c6e','directors_list',NULL,NULL,'uploads/045ecd1268c1b4533c8268428e7ce8f4_2026_10_07_15_33_18.pdf','JeoDan_Trading_Corporations_Directors_Shareholders.pdf','application/pdf',3813,'2026-10-07 14:33:18'),('445936fe-92c2-45d5-8f12-c44d54a5c3c4','3de67ef0-f8fb-4f11-bf1e-9e43108f6c6e','directors_list',NULL,NULL,'uploads/85c5a5205d2026_10_03_02_22_00ders.pdf','JeoDan_Trading_Corporations_Directors_Shareholders.pdf','application/pdf',3813,'2026-10-03 13:22:00'),('476b6bbb-932c-43b4-9846-d9bf057b9a77','3de67ef0-f8fb-4f11-bf1e-9e43108f6c6e','signatory_id',NULL,NULL,'uploads/a36a15701c2026_10_03_02_22_00ence.jpg','drivers-licence.jpg','image/jpeg',83149,'2026-10-03 13:22:00'),('54501249-897a-4d21-a315-647e9687510e','f8b9170a-fdb3-4369-9fcd-643925f19a7d','licence','soncap','3434','uploads/8604165b7c2026_10_03_12_20_51NCAP.png','SONCAP.png','image/png',65868,'2026-10-03 11:20:51'),('59b0835d-ee9f-43c1-8cf3-00a67dd9eb5e','3de67ef0-f8fb-4f11-bf1e-9e43108f6c6e','licence','ncs_customs_agent','sdsd','uploads/e3d26feec72026_10_03_02_22_00ity.webp','utility.webp','image/webp',34942,'2026-10-03 13:22:00'),('739a8695-8948-4064-b9d4-ad16c439576d','f8b9170a-fdb3-4369-9fcd-643925f19a7d','signatory_id',NULL,NULL,'uploads/0cc28b44172026_10_03_12_20_51ence.jpg','drivers-licence.jpg','image/jpeg',83149,'2026-10-03 11:20:51'),('7954b1db-f871-48c7-82a1-96d47ce05c4b',NULL,'tin',NULL,NULL,'uploads/organisation-documents/8c73b3a8970a71426536c076edc3c1189c73851643bd4ed7.jpg','CAC.jpg','image/jpeg',213489,'2026-10-09 14:24:56'),('7ae81cb1-5590-4693-b1ce-982cfddef2c4','f8b9170a-fdb3-4369-9fcd-643925f19a7d','',NULL,NULL,'uploads/20a2850f122026_10_03_12_20_51ity.webp','utility.webp','image/webp',34942,'2026-10-03 11:20:51'),('8492c69c-431c-411f-b90a-ad2c9e10da0b','3de67ef0-f8fb-4f11-bf1e-9e43108f6c6e','',NULL,NULL,'uploads/2f0066af792026_10_03_02_22_00ity.webp','utility.webp','image/webp',34942,'2026-10-03 13:22:00'),('84d9a23a-a33f-3b74-79da-5aa04faa7703',NULL,'signatory_id',NULL,NULL,'uploads/5b9c0ced06f623e9014988f1e25228ceaa038eb4cf23f743.jpg','drivers-licence.jpg','image/jpeg',83149,'2026-10-09 15:26:23'),('93f51ad8-2c1d-4054-80df-8d5f77d8f93f','a6567683-4fd3-4513-9205-d464aeec0b2f','tin',NULL,NULL,'uploads/c994eddf212026_10_01_03_33_18ance.jpg','Tax-clearance.jpg','image/jpeg',56688,'2026-10-01 13:33:18'),('ae93afa7-f5e1-4aa7-a4c7-915e91a49576','f8b9170a-fdb3-4369-9fcd-643925f19a7d','licence','nafdac','3443','uploads/8dc6e882e42026_10_03_12_20_51fdac.jpg','nafdac.jpg','image/jpeg',30816,'2026-10-03 11:20:51'),('bbd99577-a3f4-4687-b40d-845c2de71144',NULL,'utility_bill',NULL,NULL,'uploads/organisation-documents/962b428a5f077a33c1e0ba241e5f96db23296ed559d406e4.jpg','istockphoto-1289461335-612x612.jpg','image/jpeg',23983,'2026-10-09 14:39:19'),('be191640-1517-43e8-b72c-29ac830c9206','f8b9170a-fdb3-4369-9fcd-643925f19a7d','cac',NULL,NULL,'uploads/5e2bec5e432026_10_03_12_20_51CAC.jpg','CAC.jpg','image/jpeg',213489,'2026-10-03 11:20:51'),('c49d989c-ea00-4446-8584-18b3e876c078','f8b9170a-fdb3-4369-9fcd-643925f19a7d','',NULL,NULL,'uploads/0474094ef42026_10_03_12_20_51ders.pdf','JeoDan_Trading_Corporations_Directors_Shareholders.pdf','application/pdf',3813,'2026-10-03 11:20:51'),('d5399b12-4eb2-4d16-9b20-24e59817f784','3de67ef0-f8fb-4f11-bf1e-9e43108f6c6e','cac',NULL,NULL,'uploads/b3ed4e42bc2026_10_03_02_22_00CAC.jpg','CAC.jpg','image/jpeg',213489,'2026-10-03 13:22:00'),('d639d935-b164-4e13-8eaa-dc507429ebe6','f8b9170a-fdb3-4369-9fcd-643925f19a7d','tin',NULL,NULL,'uploads/feeaaa1aab2026_10_03_12_20_51ance.jpg','Tax-clearance.jpg','image/jpeg',56688,'2026-10-03 11:20:51'),('d7c15eb3-63c1-4f4c-86ca-a51e2ad7ac3f','a6567683-4fd3-4513-9205-d464aeec0b2f','signatory_id',NULL,NULL,'uploads/8c7e3ac2ba2026_10_01_03_33_18ence.jpg','drivers-licence.jpg','image/jpeg',83149,'2026-10-01 13:33:18'),('f540a7ce-914a-4d1e-853d-634861c5de67','3de67ef0-f8fb-4f11-bf1e-9e43108f6c6e','tin',NULL,NULL,'uploads/eb1e86245d2026_10_03_02_22_00ance.jpg','Tax-clearance.jpg','image/jpeg',56688,'2026-10-03 13:22:00'),('f9a88e37-a6e0-4a9a-baf5-63029389d1eb','a6567683-4fd3-4513-9205-d464aeec0b2f','cac',NULL,NULL,'uploads/568e0915192026_10_01_03_33_18CAC.jpg','CAC.jpg','image/jpeg',213489,'2026-10-01 13:33:18'),('fedfbab6-7cdd-4e1d-831c-4671ce979d14','a6567683-4fd3-4513-9205-d464aeec0b2f','licence','son','23232','uploads/658d9901b683976269a580cd86254659_2026_10_01_18_55_26.png','SONCAP.png','image/png',65868,'2026-10-01 16:55:26');
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
INSERT INTO `registration_otps` VALUES ('00823cb4-a54d-40b7-8719-b99463900d28','a6567683-4fd3-4513-9205-d464aeec0b2f','sms','08164902529','$2y$10$.ydcCE/Y4NQRj2OfYdQRaumrdvyVoepWmuMxCZ91y0aloOCi77.mi','registration_phone',0,5,0,'2026-10-01 15:31:17','2026-10-01 15:36:16','2026-10-01 15:33:16',NULL,'2026-10-01 13:31:17'),('1b1d4d39-74e2-43cf-b40b-f614395a6f14','b9595407-e16c-4283-a3f5-bc2d945d1d91','email','d.stone.david@gmail.com','$2y$10$EFuePpx//7zFfiv05ioAOOVCIesdE2nELJQqL6uNUoW1maCeuhxWe','registration_email',0,5,0,'2026-10-01 14:48:16','2026-10-01 14:53:16','2026-10-03 12:20:49',NULL,'2026-10-01 12:48:16'),('1b3387d5-92bf-4bee-a7f8-7ccf3bcbf7f3','2142b5b0-323a-4001-b618-908403a24ad0','sms','08083654765','$2y$10$8SPCcrPtLTMj2MW5wcD8Yud0ynXwnLsBXq8wZhte7ytymKbpEpZTu','registration_phone',0,5,3,'2026-10-03 14:09:34','2026-10-03 14:14:33','2026-10-03 14:09:55',NULL,'2026-10-03 13:09:34'),('1ec8d9d6-944b-48bc-aa1c-29da60b7bac5','f8b9170a-fdb3-4369-9fcd-643925f19a7d','email','hfqsystem@gmail.com','$2y$10$5ycneg7OLW/6RI2WjdcSNuJqyBjtcieDYoB3CWPY/prAfQL.Y.bFm','registration_email',0,5,0,'2026-10-03 12:20:01','2026-10-03 12:25:01','2026-10-03 12:20:49',NULL,'2026-10-03 11:20:01'),('37216e3a-959a-428e-b958-b1c14c0596e6','2142b5b0-323a-4001-b618-908403a24ad0','email','eloike92@gmail.com','$2y$10$CUZvhviXI69n/oWHBU9dZuN/umZOSr9RZfgywwlUcNdodkJ.S1ThW','registration_email',0,5,1,'2026-10-03 13:41:19','2026-10-03 13:51:19','2026-10-03 13:41:38',NULL,'2026-10-03 12:41:19'),('3ff9cfde-234a-4d35-b3df-91b2685f4f20','2142b5b0-323a-4001-b618-908403a24ad0','email','eloike92@gmail.com','$2y$10$RYOHS9ciFT0dR5hnR.7ree6nkSAJMTuGnJzqIC5JLc3RvnjmiZTvq','registration_email',0,5,1,'2026-10-03 14:09:10','2026-10-03 14:19:10','2026-10-03 14:09:32',NULL,'2026-10-03 13:09:10'),('4ad52bf9-de97-4af6-b5b6-54573c278547','2142b5b0-323a-4001-b618-908403a24ad0','email','eloike92@gmail.com','$2y$10$oTigXWGYSN4PIwaSRmAXZO4Y8HmT1BPWWiL5JLXHVk.eQ2dSL6QGK','registration_email',0,5,1,'2026-10-03 13:55:51','2026-10-03 14:05:51',NULL,'2026-10-03 13:56:49','2026-10-03 12:55:51'),('4dadf792-ebf2-479e-b593-4178210f78eb','2142b5b0-323a-4001-b618-908403a24ad0','email','eloike92@gmail.com','$2y$10$YzqdnEPyBO9D8Vv2dp5pV.scd4pc9Qx0tfmFLzqXF1395VMHRU2/K','registration_email',1,5,1,'2026-10-03 13:59:11','2026-10-03 14:09:11','2026-10-03 14:00:11',NULL,'2026-10-03 12:59:11'),('56db1960-8876-4bd6-9349-24469561ac82','7c6b2442-10d8-4111-9db7-1fcfd932008e','sms','08164902509','$2y$10$wXSFS4jiWUTb8r2hukTtY..S50Yy8MDmt2rjnnoAC.M0vE1OUfuIy','registration_phone',0,5,1,'2026-10-03 12:59:44','2026-10-03 13:04:43',NULL,NULL,'2026-10-03 11:59:44'),('70742082-19dc-4087-8043-7fc947ceca72','b9595407-e16c-4283-a3f5-bc2d945d1d91','sms','08164902529','$2y$10$ooWSaK2Ey3epPNaFO18UduKARGyo.kpcjHzia9mOQrMuKwdmFKRGW','registration_phone',0,5,0,'2026-10-01 15:06:53','2026-10-01 15:11:52',NULL,NULL,'2026-10-01 13:06:53'),('792d9fbc-8895-4c63-b83a-da6627cea809','f8b9170a-fdb3-4369-9fcd-643925f19a7d','sms','08083654765','$2y$10$.9R8c2.hxu9dicnEfQ1gveLVj7NWL8oOUYyHU2/X8KWPnMQ3SZDkO','registration_phone',0,5,0,'2026-10-03 12:20:19','2026-10-03 12:25:18','2026-10-03 12:20:47',NULL,'2026-10-03 11:20:19'),('812d3089-19a5-4b76-8c0f-e729418b756d','2142b5b0-323a-4001-b618-908403a24ad0','sms','08164902529','$2y$10$kJmY7eYrY9B.cIugyr6ywuDIdOPRuYvjjIdrVsw/T0VQ0UuxFqswi','registration_phone',0,5,2,'2026-10-03 14:03:03','2026-10-03 14:08:03',NULL,'2026-10-03 14:09:33','2026-10-03 13:03:03'),('8c72e405-d999-45b7-a165-e1fa0bfdde7e','2142b5b0-323a-4001-b618-908403a24ad0','email','eloike92@gmail.com','$2y$10$XPp7B55BFlBSBoWsQYmvkO00rvAt38SI7gaRdPenp9h/RavPgpPnu','registration_email',0,5,1,'2026-10-03 13:57:28','2026-10-03 14:07:28',NULL,'2026-10-03 13:59:11','2026-10-03 12:57:28'),('a5c702ec-ce0b-446b-a001-cb0f715dd79f','a6567683-4fd3-4513-9205-d464aeec0b2f','email','d.stone.david@gmail.com','$2y$10$S2rRnRw6kzkgsZhMhWfybuT7ZA7SXuwrrELaDZpL43DYV0PatbnFC','registration_email',0,5,0,'2026-10-01 15:30:50','2026-10-01 15:35:50','2026-10-03 12:50:36',NULL,'2026-10-01 13:30:50'),('a8fd68f7-da56-4b32-b818-e6bb6ce1b7f6','2142b5b0-323a-4001-b618-908403a24ad0','email','eloike92@gmail.com','$2y$10$hROSSeZpHtqcRprrsRnQf.hBkFhcN9MmTpveNap/Wa11lgvVAEzyq','registration_email',0,5,1,'2026-10-03 13:56:49','2026-10-03 14:06:49',NULL,'2026-10-03 13:57:28','2026-10-03 12:56:49'),('ad9d2589-bb7e-4a0a-b598-21f727205047','3de67ef0-f8fb-4f11-bf1e-9e43108f6c6e','sms','08083654765','$2y$10$a3Y/NGBWcNbiE99yqrpi7uKhU5yipLAgmTVlDTkwsUucphNSsvNoi','registration_phone',0,5,2,'2026-10-03 14:21:40','2026-10-03 14:26:40','2026-10-03 14:21:58',NULL,'2026-10-03 13:21:40'),('ba2c6b89-86e0-468b-a2a2-3bdee1cdf17e','7c6b2442-10d8-4111-9db7-1fcfd932008e','email','danjumabush@gmail.com','$2y$10$h5qmgIlhJogV8LjCiswkEOy9h4MnP8pUjkDUlEbVSMgIInMPu8wOq','registration_email',0,5,0,'2026-10-03 12:49:59','2026-10-03 12:54:59','2026-10-03 12:50:36',NULL,'2026-10-03 11:49:59'),('bcbb8403-b1d0-47','a5abe645-d228-4f','email','hqfdevelopers@gmail.com','$2y$10$SEfXGJLeG/4rmVCL2kBv8.Rhuo38/HpS/5rITnXfFcB6wqDrcr.kK','registration_email',0,5,0,'2026-09-29 14:55:35','2026-09-29 15:00:35','2026-10-03 12:50:36',NULL,'2026-09-29 11:55:35'),('c18887ef-c8a2-4789-a7e8-5ee6f847dad4','3de67ef0-f8fb-4f11-bf1e-9e43108f6c6e','email','eloike92@gmail.com','$2y$10$F9nRbwdYDOn4ejlslzaSResg3RlfjnyGdKhCeIbl1nFKAS73rpDW2','registration_email',0,5,1,'2026-10-03 14:20:08','2026-10-03 14:30:08','2026-10-03 14:20:26',NULL,'2026-10-03 13:20:08'),('c2850b31-272a-46af-81cb-c03c7055c787','ed23559d-853c-4f5f-b869-8375802bb52a','email','danjumabush@gmail.com','$2y$10$nmertEGU3RPwIzd1TeyA4O9YQwY3u9/3dCNCm9IPh1/setG2kMwbG','registration_email',0,5,1,'2026-10-03 13:29:48','2026-10-03 13:39:48',NULL,'2026-10-03 13:34:24','2026-10-03 12:29:48'),('c4009bf7-d4cd-4d90-9554-a35d35ff9ede','2142b5b0-323a-4001-b618-908403a24ad0','sms','08164902529','$2y$10$CpDkqSl154aztM2vmAEw3O4yYjjTBBFxGqL2GJQNITP277Lj2mTN6','registration_phone',0,5,1,'2026-10-03 14:00:14','2026-10-03 14:05:14',NULL,'2026-10-03 14:03:03','2026-10-03 13:00:14'),('c8117ccf-c4ec-4aa7-8861-04773a08c678','7c6b2442-10d8-4111-9db7-1fcfd932008e','sms','08164902509','$2y$10$4t8CB.Bok/Nr7YXFxhDx8uWNpnuRKBhyNX4mi/h1MCAo6yVrTe7Iy','registration_phone',0,5,0,'2026-10-03 12:50:39','2026-10-03 12:55:38',NULL,'2026-10-03 12:59:43','2026-10-03 11:50:39'),('f6c258b3-b7e9-4c4c-8063-02d0f4feb2bd','3de67ef0-f8fb-4f11-bf1e-9e43108f6c6e','sms','08164902529','$2y$10$fi28A7jTUeXOvv60RlCa8O5aX/uV4ELpqdqlfu9wOM/NdG3IzUkx2','registration_phone',0,5,1,'2026-10-03 14:20:30','2026-10-03 14:25:30',NULL,'2026-10-03 14:21:40','2026-10-03 13:20:30'),('f9630e9a-f56a-4584-b26c-7c768695a856','ed23559d-853c-4f5f-b869-8375802bb52a','email','danjumabush@gmail.com','$2y$10$PLJu1yN2qInt.8aiTE.x4.suNbsZiQqIoT6ElbaAH3wKXIr6MKpV6','registration_email',0,5,1,'2026-10-03 13:34:24','2026-10-03 13:44:24','2026-10-03 13:34:47',NULL,'2026-10-03 12:34:24');
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
  `email` varchar(254) NOT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `status` enum('pending_otp','verified','completed','expired','cancelled','locked') NOT NULL DEFAULT 'pending_otp',
  `email_verified_at` datetime DEFAULT NULL,
  `phone_verified_at` datetime DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `completed_user_id` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_registration_ref` (`registration_ref`),
  KEY `idx_registration_email` (`email`),
  KEY `idx_registration_status` (`status`),
  KEY `idx_registration_expiry` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registration_requests`
--

LOCK TABLES `registration_requests` WRITE;
/*!40000 ALTER TABLE `registration_requests` DISABLE KEYS */;
INSERT INTO `registration_requests` VALUES ('2142b5b0-323a-4001-b618-908403a24ad0','15c1e745-ec95-4956-8450-3f215bacb6c2','eloike92@gmail.com','08083654765','verified','2026-10-03 14:09:32','2026-10-03 14:09:55','2026-10-03 14:11:19',NULL,'2026-10-03 12:41:19','2026-10-03 13:09:55'),('3de67ef0-f8fb-4f11-bf1e-9e43108f6c6e','d2267817-e123-4a86-99bc-c9ebd967b850','eloike92@gmail.com','08083654765','completed','2026-10-03 14:20:26','2026-10-03 14:21:58','2026-10-03 14:50:08','4a9ba8d5-93b6-4b65-af96-934920afcd18','2026-10-03 13:20:08','2026-10-03 13:22:00'),('7c6b2442-10d8-4111-9db7-1fcfd932008e','8900ba2b-8099-4b6f-b606-19937c4705db','danjumabush@gmail.com',NULL,'verified','2026-10-03 12:50:36',NULL,'2026-10-03 13:19:59',NULL,'2026-10-03 11:49:59','2026-10-03 11:50:36'),('a5abe645-d228-4f','49f75b78-b5c9-4d9d-9d1a-ea3b8847dff1','hqfdevelopers@gmail.com',NULL,'completed','2026-09-29 14:56:17',NULL,'2026-09-29 15:25:35','682f7cf2-b05f-4c','2026-09-29 11:55:35','2026-09-29 11:56:20'),('a6567683-4fd3-4513-9205-d464aeec0b2f','7c95dd36-011d-4668-9de9-c378ec26270e','d.stone.david@gmail.com',NULL,'completed','2026-10-01 15:31:14','2026-10-01 15:33:16','2026-10-01 16:00:50','ff20dfcf-f843-4cd3-a263-412210683de9','2026-10-01 13:30:50','2026-10-01 13:33:18'),('b9595407-e16c-4283-a3f5-bc2d945d1d91','a1ae81fe-853a-473f-80f4-a2513dc7d149','d.stone.david@gmail.com',NULL,'expired','2026-10-01 14:48:41',NULL,'2026-10-01 15:18:16',NULL,'2026-10-01 12:48:16','2026-10-01 13:28:35'),('ed23559d-853c-4f5f-b869-8375802bb52a','7650933a-158f-43ef-910f-5eb2dfb24401','danjumabush@gmail.com',NULL,'verified','2026-10-03 13:34:47',NULL,'2026-10-03 13:59:48',NULL,'2026-10-03 12:29:48','2026-10-03 12:34:47'),('f8b9170a-fdb3-4369-9fcd-643925f19a7d','ace1e8e8-1b80-43e4-a4a4-cf4934d87907','hfqsystem@gmail.com',NULL,'completed','2026-10-03 12:20:49','2026-10-03 12:20:47','2026-10-03 12:50:01','53698470-56d3-4848-b65c-097021bd2823','2026-10-03 11:20:01','2026-10-03 11:20:51');
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
INSERT INTO `role_permissions` VALUES ('18386d94-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e5fa-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e62d-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e65c-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e68d-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e6c1-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e6fa-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e72a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e75b-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e78b-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e7d5-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e809-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e83b-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e86a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e89f-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e8d6-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e909-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e93f-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e977-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e9a8-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838e9dc-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838ea93-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18386d94-bc37-11f1-bb55-5081407ad051','1838ead1-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e5fa-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e62d-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e65c-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e68d-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e6c1-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e6fa-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e72a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e75b-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e78b-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e7d5-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e809-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e83b-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e86a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e89f-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e8d6-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e909-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','1838e93f-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e5fa-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e78b-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','1838e7d5-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e445-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e477-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e4a9-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e4db-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e50a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e53a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e56b-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e013-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e040-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e071-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e0a9-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e0dd-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e115-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e144-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e174-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e1a4-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e1d8-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e20a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e23e-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387679-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e270-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e2a1-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e2d6-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e30e-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e347-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183876de-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e37c-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e3af-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e3e0-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e414-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838771d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e62d-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e65c-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e68d-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('1838775d-bc37-11f1-bb55-5081407ad051','1838e6c1-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e5c9-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e6fa-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e72a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','1838e75b-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','1838e59a-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838d8fb-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838defc-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838df69-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838dfa3-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','1838dfdd-bc37-11f1-bb55-5081407ad051','2026-09-29 16:53:45');
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
INSERT INTO `roles` VALUES ('18386d94-bc37-11f1-bb55-5081407ad051','system_admin','System Administrator','system','Platform-wide administration across all organisations.',1,'2026-09-29 16:53:45','2026-09-29 16:53:45'),('183874f2-bc37-11f1-bb55-5081407ad051','organisation_owner','Organisation Owner','organisation','Full access to the organisation and its operational functions.',1,'2026-09-29 16:53:45','2026-09-29 16:53:45'),('1838759d-bc37-11f1-bb55-5081407ad051','management','Management','organisation','Management dashboards, reports and authorised operational and financial visibility.',1,'2026-09-29 16:53:45','2026-09-29 16:53:45'),('183875e3-bc37-11f1-bb55-5081407ad051','finance','Finance','organisation','Tariffs, invoices, payments, collections and reconciliation.',1,'2026-09-29 16:53:45','2026-09-29 16:53:45'),('1838762d-bc37-11f1-bb55-5081407ad051','terminal_operations','Terminal Operations','system','Cargo receiving, movements, holds, exceptions and operational workflows.',1,'2026-09-29 16:53:45','2026-10-02 13:39:24'),('18387679-bc37-11f1-bb55-5081407ad051','gate_officer','Gate Officer','system','Gate bookings, gate decisions, gate-in and gate-out operations.',1,'2026-09-29 16:53:45','2026-10-02 13:38:51'),('183876de-bc37-11f1-bb55-5081407ad051','warehouse_yard_officer','Warehouse / Yard Officer','system','Warehouse, yard, inventory, positioning, picking and relocation operations.',1,'2026-09-29 16:53:45','2026-10-02 13:38:56'),('1838771d-bc37-11f1-bb55-5081407ad051','documentation_officer','Documentation Officer','system','Document registration, verification and issuance.',1,'2026-09-29 16:53:45','2026-10-02 13:39:16'),('1838775d-bc37-11f1-bb55-5081407ad051','customer_service_sales','Customer Service / Sales','organisation','Enquiries, quotations, onboarding and customer service workflows.',1,'2026-09-29 16:53:45','2026-09-29 16:53:45'),('18387796-bc37-11f1-bb55-5081407ad051','compliance_customs_liaison','Compliance / Customs Liaison','organisation','Compliance workflows, Customs liaison and audit response.',1,'2026-09-29 16:53:45','2026-09-29 16:53:45'),('183877f2-bc37-11f1-bb55-5081407ad051','regulator_auditor','Regulator / Auditor','organisation','Scoped read-only access to authorised records.',1,'2026-09-29 16:53:45','2026-09-29 16:53:45'),('183f5203-bc37-11f1-bb55-5081407ad051','portal_user','Portal User','organisation','Basic authorised stakeholder portal access.',1,'2026-09-29 16:53:45','2026-09-29 16:53:45');
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
INSERT INTO `sessions` VALUES ('0997562a-0144-448b-a90d-063ffddd8167','ff20dfcf-f843-4cd3-a263-412210683de9','33b8ceaf16748dafd377c91d39e5e15c266ebbe4a0eae2619e2380d490b6fd46',NULL,'Firefox on Windows (Desktop)','unknown',NULL,NULL,'127.0.0.1','Abuja, FCT, Nigeria',0,1,'2026-10-01 18:00:50','2026-10-31 18:00:50',NULL,NULL,'2026-10-01 16:00:50'),('1198246b-102c-4adf-85b6-a0460cf9b95a','4a9ba8d5-93b6-4b65-af96-934920afcd18','397fb86b977b57e309ee610d0c7967197d58a6b4f8e994cb56be5d01666af187',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-03 15:30:23','2026-11-02 15:30:23',NULL,NULL,'2026-10-03 14:30:23'),('2632d7e9-af51-46e5-9b6f-dd62e125af17','4a9ba8d5-93b6-4b65-af96-934920afcd18','a196a7f8508b401cac5197ca1458e65bad8d19eeb0d0af1de05cd57d11e618dc',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-03 14:46:01','2026-11-02 14:46:01',NULL,NULL,'2026-10-03 13:46:01'),('3881279e-11ea-4f3c-9d76-11927c1c28ac','ff20dfcf-f843-4cd3-a263-412210683de9','24218105a69709b7eab7a7efdfa80417e9ab77cbf3344d0195c182a3eaa784c3',NULL,'Firefox on Windows (Desktop)','unknown',NULL,NULL,'127.0.0.1','Abuja, FCT, Nigeria',0,1,'2026-10-02 12:53:24','2026-11-01 12:53:24',NULL,NULL,'2026-10-02 10:53:24'),('3f779800-112f-4a40-b843-f8f03022325d','c0654f0b-8452-4a03-a43d-0d0cda17da1b','62f098acd16856c52d6fbb85725b83492b446893667f97a1f860302b74410753',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-03 12:36:27','2026-11-02 12:36:27',NULL,NULL,'2026-10-03 11:36:27'),('63ffc6d7-032d-435a-bdcf-6145ecb541c2','ff20dfcf-f843-4cd3-a263-412210683de9','fd54b95fe5fb1f4222c5491124179f80f3389ee8a6d955368df682690f48f1b4',NULL,'Firefox on Windows (Desktop)','unknown',NULL,NULL,'127.0.0.1','Abuja, FCT, Nigeria',0,1,'2026-10-01 18:20:13','2026-10-31 18:20:13',NULL,NULL,'2026-10-01 16:20:13'),('67e4f923-400e-4655-a67a-7e1bb74bcb24','ff20dfcf-f843-4cd3-a263-412210683de9','04fdd5b13e825690fa60d0de193c51a9d6f6b13e8c9235df9a412cdefc2c2c62',NULL,'Firefox on Windows (Desktop)','unknown',NULL,NULL,'127.0.0.1','Abuja, FCT, Nigeria',0,1,'2026-10-01 18:17:51','2026-10-31 18:17:51',NULL,NULL,'2026-10-01 16:17:51'),('68ef296d-8fc6-4a5f-856d-e983d5357d7e','4a9ba8d5-93b6-4b65-af96-934920afcd18','96ef396045b76fe8c218e4d3d0fdcddba9b997d9f87884a8b0d311c9f746ba32',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-03 15:01:42','2026-11-02 15:01:42',NULL,NULL,'2026-10-03 14:01:42'),('9b4fc236-f24e-4127-8259-d7816eeea03f','c0654f0b-8452-4a03-a43d-0d0cda17da1b','11a7d220a8950dc7dcaaf347897b5adc221d8d7ae134d0a27e971e0e67ea7cac',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-08 19:18:35','2026-10-10 17:20:19',NULL,NULL,'2026-10-08 18:18:35'),('b804baca-dfa2-4a05-8511-e10dcba17e0b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','de7bb0dd59388fe82003ba00911fdfbeef18f2cdb8d7d6fbc67f8e402f455cbf',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-07 14:30:28','2026-11-06 14:30:28',NULL,NULL,'2026-10-07 13:30:28'),('d375207c-6fe5-4be1-a753-2fb2117b2663','4a9ba8d5-93b6-4b65-af96-934920afcd18','ad2d2dcc6eec3d2bb76177f7532a22bc0107420d4d1616146a48eccb494fc19f',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-03 15:32:30','2026-11-02 15:32:30',NULL,NULL,'2026-10-03 14:32:30'),('e13d005b-11b9-4521-ad27-95cc3a2b1e7d','4a9ba8d5-93b6-4b65-af96-934920afcd18','204e4cedeb31c34b6d4f828d89fc5892aad44955df0cbda4d144d081c407ee30',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-07 15:17:14','2026-11-06 15:17:14',NULL,NULL,'2026-10-07 14:17:14');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `terminal_cargo_services`
--

DROP TABLE IF EXISTS `terminal_cargo_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `terminal_cargo_services` (
  `id` char(36) NOT NULL,
  `label` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_terminal_cargo_service_label` (`label`),
  KEY `idx_terminal_cargo_service_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `terminal_cargo_services`
--

LOCK TABLES `terminal_cargo_services` WRITE;
/*!40000 ALTER TABLE `terminal_cargo_services` DISABLE KEYS */;
INSERT INTO `terminal_cargo_services` VALUES ('2a1fd3d6-d6bb-4f5c-84f3-cf8f700e0f25','Industrial cargo',1,'2026-10-09 16:20:01','2026-10-09 16:20:01'),('363026a1-9d5e-4617-9515-3c89384deab7','General cargo',1,'2026-10-09 16:20:01','2026-10-09 16:20:01'),('47227fe9-8403-4585-945f-94b6e693af46','Project cargo',1,'2026-10-09 16:20:01','2026-10-09 16:20:01'),('9cef3829-3f2f-44f2-ad2c-5f66f91b96bc','Containerised cargo',1,'2026-10-09 16:20:01','2026-10-09 16:20:01'),('b2fac354-7c60-4df0-8c2e-9e9d02ab4cfc','Automotive cargo',1,'2026-10-09 16:20:01','2026-10-09 16:20:01'),('dde09f2b-a1f3-4cd0-80fc-cd7bd12533d6','Agricultural cargo',1,'2026-10-09 16:20:01','2026-10-09 16:20:01'),('e12972fd-3a19-4607-b366-ce4f551b0d64','Special cargo',1,'2026-10-09 16:20:01','2026-10-09 16:20:01');
/*!40000 ALTER TABLE `terminal_cargo_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `terminal_configuration`
--

DROP TABLE IF EXISTS `terminal_configuration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `terminal_configuration` (
  `id` tinyint(3) unsigned NOT NULL,
  `terminal_name` varchar(255) NOT NULL DEFAULT '',
  `terminal_code` varchar(80) NOT NULL DEFAULT '',
  `operating_hours` varchar(100) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_terminal_configuration_code` (`terminal_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `terminal_configuration`
--

LOCK TABLES `terminal_configuration` WRITE;
/*!40000 ALTER TABLE `terminal_configuration` DISABLE KEYS */;
INSERT INTO `terminal_configuration` VALUES (1,'Abuja Flagship Facility','TRN-ABJ-01','08:00–18:00','2026-10-09 16:20:01','2026-10-09 16:20:01');
/*!40000 ALTER TABLE `terminal_configuration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `terminal_configuration_audit`
--

DROP TABLE IF EXISTS `terminal_configuration_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `terminal_configuration_audit` (
  `id` char(36) NOT NULL,
  `actor_id` varchar(64) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `before_data` longtext DEFAULT NULL,
  `after_data` longtext NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_terminal_config_audit_actor` (`actor_id`),
  KEY `idx_terminal_config_audit_created` (`created_at`),
  KEY `idx_terminal_config_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `terminal_configuration_audit`
--

LOCK TABLES `terminal_configuration_audit` WRITE;
/*!40000 ALTER TABLE `terminal_configuration_audit` DISABLE KEYS */;
/*!40000 ALTER TABLE `terminal_configuration_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `terminal_hold_reasons`
--

DROP TABLE IF EXISTS `terminal_hold_reasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `terminal_hold_reasons` (
  `id` char(36) NOT NULL,
  `label` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_terminal_hold_reason_label` (`label`),
  KEY `idx_terminal_hold_reason_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `terminal_hold_reasons`
--

LOCK TABLES `terminal_hold_reasons` WRITE;
/*!40000 ALTER TABLE `terminal_hold_reasons` DISABLE KEYS */;
INSERT INTO `terminal_hold_reasons` VALUES ('326ddd96-a1d5-4a77-a585-16710d216b31','Regulatory agency hold',1,'2026-10-09 16:20:01','2026-10-09 16:20:01'),('447237a8-9608-46bc-b423-9ad42941464d','Outstanding charges',1,'2026-10-09 16:20:01','2026-10-09 16:20:01'),('533dbf30-0370-4d5c-816b-d8bf978eafec','Customs inspection hold',1,'2026-10-09 16:20:01','2026-10-09 16:20:01'),('6def5104-a534-4cc1-a85a-4f687520a618','Missing documentation',1,'2026-10-09 16:20:01','2026-10-09 16:20:01'),('8089b7e5-c00a-4ca8-b323-7ec919f8d7ec','Seal mismatch',1,'2026-10-09 16:20:01','2026-10-09 16:20:01'),('af7af8db-2b78-4d37-bcb6-ffa5b9968580','Cargo damage',1,'2026-10-09 16:20:01','2026-10-09 16:20:01');
/*!40000 ALTER TABLE `terminal_hold_reasons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `terminal_locations`
--

DROP TABLE IF EXISTS `terminal_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `terminal_locations` (
  `id` char(36) NOT NULL,
  `code` varchar(80) NOT NULL,
  `name` varchar(255) NOT NULL,
  `kind` enum('yard','warehouse') NOT NULL DEFAULT 'yard',
  `bonded` tinyint(1) NOT NULL DEFAULT 1,
  `status` enum('active','inactive','maintenance') NOT NULL DEFAULT 'active',
  `capacity` decimal(14,3) DEFAULT NULL,
  `capacity_unit` enum('TEU','sqm','pallets','positions','tonnes') NOT NULL DEFAULT 'TEU',
  `cargo_types` varchar(1000) NOT NULL DEFAULT '',
  `security` varchar(1000) NOT NULL DEFAULT '',
  `equipment` varchar(1000) NOT NULL DEFAULT '',
  `block_code` varchar(80) NOT NULL DEFAULT '',
  `row_code` varchar(80) NOT NULL DEFAULT '',
  `slot_code` varchar(80) NOT NULL DEFAULT '',
  `tier_code` varchar(80) NOT NULL DEFAULT '',
  `aisle_code` varchar(80) NOT NULL DEFAULT '',
  `rack_code` varchar(80) NOT NULL DEFAULT '',
  `bin_code` varchar(80) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_terminal_location_code` (`code`),
  KEY `idx_terminal_location_status` (`status`),
  KEY `idx_terminal_location_kind` (`kind`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `terminal_locations`
--

LOCK TABLES `terminal_locations` WRITE;
/*!40000 ALTER TABLE `terminal_locations` DISABLE KEYS */;
INSERT INTO `terminal_locations` VALUES ('a50a1e50-c119-49d3-83ec-db7e4132b4d3','CY-A','Container Yard A','yard',1,'active',120.000,'TEU','Import containers, export containers, transit cargo, refrigerated containers','24-hour CCTV surveillance, controlled entry gate, perimeter fencing, security patrols','Reach stacker, terminal tractor, container handler, forklift','A','01','01','Ground','CY-A-ACCESS','STACK-A01','POSITION-A-01','2026-10-09 16:20:01','2026-10-09 16:20:01'),('e1bf6d26-3b03-46f3-9983-5079f4566048','BW-1','Bonded Warehouse 1','warehouse',1,'active',2400.000,'sqm','General cargo, palletised goods, agricultural products, industrial goods','CCTV surveillance, controlled access, fire detection system, intruder alarm','Forklift, electric pallet truck, platform weighing scale, loading dock equipment','WH-B','01','01','Ground','A','R01','B01','2026-10-09 16:20:01','2026-10-09 16:20:01');
/*!40000 ALTER TABLE `terminal_locations` ENABLE KEYS */;
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
INSERT INTO `user_invitations` VALUES ('8c823e71-b927-45ca-87ed-a7c32a8968e3','e4d5623b-c569-4ac9-ba75-9bdd7968a70b','a0e94b9af5b9ae99715c8b376c2a164d0fbb142e2012b06aef53fcf81524def5','2026-10-10 16:17:36','2026-10-07 17:51:09',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-07 15:17:36'),('f71fd05d-44ad-45ef-8e93-c28380eb8d7a','2c1cb0a6-1b1b-4fb0-9dd0-025765bb5046','7a22b02e6caa91e965720d31de1a1acce038cc32efa9e0ec6efca53d129d173b','2026-10-10 18:51:03','2026-10-07 18:55:36',NULL,'e4d5623b-c569-4ac9-ba75-9bdd7968a70b','2026-10-07 17:51:03');
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
INSERT INTO `users` VALUES ('2c1cb0a6-1b1b-4fb0-9dd0-025765bb5046','d2beefba-e4bc-4d','organisation',NULL,'samson joseph','sammy@mailinator.com','08083654765','avatar.png','$2y$10$DxM4z2ufkZebmpjGZ.jc2uFjgP9C.MzE9HPFIg.9H68OqEn5HlrZ.','2026-10-07 18:54:59','2026-10-07 18:55:36',0,NULL,'active',0,NULL,NULL,'2026-10-07 18:54:59','2026-10-07 17:51:03','2026-10-07 17:55:36'),('4a9ba8d5-93b6-4b65-af96-934920afcd18','6540d4e1-2545-48e7-8671-02a7eba57610','organisation',NULL,'wewe','eloike92@gmail.com','08083657650','avatar.png','$2y$10$lAULEsMq3WId21AeQcn.y.EEzVmCUnwEqj1GQJI9St.xhjQsC0Qv.','2026-10-03 14:20:26','2026-10-03 14:21:58',0,NULL,'active',0,NULL,'2026-10-07 15:17:14','2026-10-03 14:22:00','2026-10-03 13:22:00','2026-10-07 15:05:43'),('53698470-56d3-4848-b65c-097021bd2823','eee3288a-4560-46e2-a957-31db1b0d8c73','organisation',NULL,'Sam geo','hfqsystem@gmail.com','085566565','avatar.png','$2y$10$ovv5V5alR6uSqpO5rTTXROc4CwtvOBQApDYRwLgBSBJLG0w2Yx4W6','2026-10-03 12:20:49','2026-10-03 12:20:47',0,NULL,'active',0,NULL,NULL,'2026-10-03 12:20:51','2026-10-03 11:20:51','2026-10-07 14:33:50'),('c0654f0b-8452-4a03-a43d-0d0cda17da1b','d2beefba-e4bc-4d','system','18386d94-bc37-11f1-bb55-5081407ad051','Mathias Jacobs','hqfdevelopers@gmail.com','+12048876135','avatar.png','$2y$10$zcBBokR1lYIJ79F46S/0NuQVBAvdct7rQnRmQGWTtWbHow4Ap0Ou2','2026-10-03 12:20:47','2026-10-03 12:20:47',0,NULL,'active',0,NULL,'2026-10-08 19:18:35',NULL,'2026-10-02 16:44:33','2026-10-08 18:18:35'),('e4d5623b-c569-4ac9-ba75-9bdd7968a70b','d2beefba-e4bc-4d','system','1838771d-bc37-11f1-bb55-5081407ad051','Mathias Jacobs','lovebiteonline4@gmail.com','080873654765','avatar.png','$2y$10$hBvf2/.3fdSYpPim50IBMePnGh15//aVfv0EFWnh0IrlqRHy/pUqu','2026-10-07 16:21:10','2026-10-07 17:51:09',0,NULL,'active',0,NULL,'2026-10-07 18:02:46','2026-10-07 17:50:03','2026-10-07 15:17:36','2026-10-07 17:54:53'),('ff20dfcf-f843-4cd3-a263-412210683de9','0a91a3fc-c629-45a7-a246-70bde778408d','organisation',NULL,'Eloike david','d.stone.david@gmail.com','0805562525','avatar.png','$2y$10$zcBBokR1lYIJ79F46S/0NuQVBAvdct7rQnRmQGWTtWbHow4Ap0Ou2','2026-10-01 15:31:14','2026-10-01 15:33:16',0,NULL,'active',0,NULL,'2026-10-03 11:26:14','2026-10-01 15:33:18','2026-10-01 13:33:18','2026-10-03 11:47:14');
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

-- Dump completed on 2026-10-09 17:20:48
