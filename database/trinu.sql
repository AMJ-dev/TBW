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
-- Table structure for table `cargo_config_audit`
--

DROP TABLE IF EXISTS `cargo_config_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cargo_config_audit` (
  `id` char(36) NOT NULL,
  `config_version_id` char(36) NOT NULL,
  `actor_id` varchar(64) NOT NULL,
  `action` varchar(80) NOT NULL,
  `change_reason` varchar(500) NOT NULL,
  `before_json` longtext DEFAULT NULL,
  `after_json` longtext NOT NULL,
  `request_id` varchar(100) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_cargo_config_audit_version` (`config_version_id`,`id`),
  KEY `idx_cargo_config_audit_actor` (`actor_id`,`created_at`),
  CONSTRAINT `fk_cargo_config_audit_version` FOREIGN KEY (`config_version_id`) REFERENCES `cargo_config_versions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cargo_config_audit`
--

LOCK TABLES `cargo_config_audit` WRITE;
/*!40000 ALTER TABLE `cargo_config_audit` DISABLE KEYS */;
INSERT INTO `cargo_config_audit` VALUES ('035264c1-2f04-4440-95a2-0a9e0d6f40bd','96dd9a2d-656d-47e3-a403-203addf7c549','c0654f0b-8452-4a03-a43d-0d0cda17da1b','CARGO_CONFIGURATION_UPDATED','Cargo lifecycle configuration updated','{\"version_id\":\"26e9b717-671d-4b6c-b548-13b1145dbb82\",\"states\":[{\"id\":\"s-1\",\"code\":\"EXPECTED\",\"internal_label\":\"Expected\",\"customer_label\":\"Expected\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":0},{\"id\":\"s-2\",\"code\":\"IN_TRANSIT_TO_TERMINAL\",\"internal_label\":\"In transit to terminal\",\"customer_label\":\"In transit to terminal\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":1},{\"id\":\"s-3\",\"code\":\"ARRIVED_AT_GATE\",\"internal_label\":\"Arrived at gate\",\"customer_label\":\"Arrived at terminal\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":2},{\"id\":\"s-4\",\"code\":\"RECEIVED\",\"internal_label\":\"Received\",\"customer_label\":\"Received\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":3},{\"id\":\"s-5\",\"code\":\"STORED\",\"internal_label\":\"Stored\",\"customer_label\":\"In storage\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":4},{\"id\":\"s-6\",\"code\":\"DOCS_IN_PROGRESS\",\"internal_label\":\"Documentation in progress\",\"customer_label\":\"Documentation in progress\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":5},{\"id\":\"s-7\",\"code\":\"EXAMINATION_SCHEDULED\",\"internal_label\":\"Examination scheduled\",\"customer_label\":\"Examination scheduled\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":6},{\"id\":\"s-8\",\"code\":\"UNDER_EXAMINATION\",\"internal_label\":\"Under examination\",\"customer_label\":\"Under examination\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":7},{\"id\":\"s-9\",\"code\":\"EXAMINATION_COMPLETE\",\"internal_label\":\"Examination complete\",\"customer_label\":\"Examination complete\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":8},{\"id\":\"s-10\",\"code\":\"HELD\",\"internal_label\":\"Held\",\"customer_label\":\"On hold — contact operations\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":9},{\"id\":\"s-11\",\"code\":\"CHARGES_PENDING\",\"internal_label\":\"Charges pending\",\"customer_label\":\"Charges pending\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":10},{\"id\":\"s-12\",\"code\":\"CHARGES_SETTLED\",\"internal_label\":\"Charges settled\",\"customer_label\":\"Charges settled\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":11},{\"id\":\"s-13\",\"code\":\"RELEASE_AUTHORISED\",\"internal_label\":\"Release authorised\",\"customer_label\":\"Released for collection\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":12},{\"id\":\"s-14\",\"code\":\"SLOT_BOOKED\",\"internal_label\":\"Slot booked\",\"customer_label\":\"Collection booked\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":13},{\"id\":\"s-15\",\"code\":\"LOADING\",\"internal_label\":\"Loading\",\"customer_label\":\"Loading\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":14},{\"id\":\"s-16\",\"code\":\"GATE_OUT\",\"internal_label\":\"Gate out\",\"customer_label\":\"Collected\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":15},{\"id\":\"s-17\",\"code\":\"CLOSED\",\"internal_label\":\"Closed\",\"customer_label\":\"Closed\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":16},{\"id\":\"s-18\",\"code\":\"OVERSTAYED\",\"internal_label\":\"Overstayed\",\"customer_label\":\"Overstayed — action required\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":17},{\"id\":\"s-19\",\"code\":\"TRANSFERRED_OUT\",\"internal_label\":\"Transferred out\",\"customer_label\":\"Transferred\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":18},{\"id\":\"s-20\",\"code\":\"RETURNED_RE_EXPORTED\",\"internal_label\":\"Returned / Re-exported\",\"customer_label\":\"Returned / Re-exported\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":19}],\"transitions\":[{\"id\":\"t-1\",\"from\":\"EXPECTED\",\"to\":\"IN_TRANSIT_TO_TERMINAL\",\"requires_hold_clear\":1,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":0},{\"id\":\"t-2\",\"from\":\"IN_TRANSIT_TO_TERMINAL\",\"to\":\"ARRIVED_AT_GATE\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":1},{\"id\":\"t-3\",\"from\":\"ARRIVED_AT_GATE\",\"to\":\"RECEIVED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":2},{\"id\":\"t-4\",\"from\":\"RECEIVED\",\"to\":\"STORED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":3},{\"id\":\"t-5\",\"from\":\"STORED\",\"to\":\"DOCS_IN_PROGRESS\",\"requires_hold_clear\":0,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":4},{\"id\":\"t-6\",\"from\":\"DOCS_IN_PROGRESS\",\"to\":\"EXAMINATION_SCHEDULED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":5},{\"id\":\"t-7\",\"from\":\"EXAMINATION_SCHEDULED\",\"to\":\"UNDER_EXAMINATION\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":6},{\"id\":\"t-8\",\"from\":\"UNDER_EXAMINATION\",\"to\":\"EXAMINATION_COMPLETE\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":7},{\"id\":\"t-9\",\"from\":\"EXAMINATION_COMPLETE\",\"to\":\"CHARGES_PENDING\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":8},{\"id\":\"t-10\",\"from\":\"CHARGES_PENDING\",\"to\":\"CHARGES_SETTLED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":9},{\"id\":\"t-11\",\"from\":\"CHARGES_SETTLED\",\"to\":\"RELEASE_AUTHORISED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":10},{\"id\":\"t-12\",\"from\":\"RELEASE_AUTHORISED\",\"to\":\"SLOT_BOOKED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":11},{\"id\":\"t-13\",\"from\":\"SLOT_BOOKED\",\"to\":\"LOADING\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":0,\"active\":1,\"sort_order\":12},{\"id\":\"t-14\",\"from\":\"LOADING\",\"to\":\"GATE_OUT\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":13},{\"id\":\"t-15\",\"from\":\"GATE_OUT\",\"to\":\"CLOSED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":0,\"active\":1,\"sort_order\":14}],\"hold_policies\":[{\"id\":\"h-1\",\"type\":\"Customs\",\"authority_required\":1,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":0},{\"id\":\"h-2\",\"type\":\"Agency\",\"authority_required\":1,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":1},{\"id\":\"h-3\",\"type\":\"Terminal\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":2},{\"id\":\"h-4\",\"type\":\"Financial\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":3},{\"id\":\"h-5\",\"type\":\"Damage\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":4},{\"id\":\"h-6\",\"type\":\"Documentation\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":5}],\"behaviour\":{\"auto_notify_on_transition\":true,\"allow_bulk_transitions\":true,\"split_merge_preserves_lineage\":true,\"pause_storage_on_hold\":false,\"track_container_level\":true,\"track_package_level\":true},\"settings\":{\"auto_notify_on_transition\":1,\"allow_bulk_transitions\":1,\"split_merge_preserves_lineage\":1,\"pause_storage_on_hold\":0,\"track_container_level\":1,\"track_package_level\":1,\"require_docs_for_release\":1,\"require_no_active_holds\":1,\"require_financial_clearance\":1,\"allow_approved_credit_or_waiver\":0,\"require_gate_verification\":1}}','{\"version_id\":\"96dd9a2d-656d-47e3-a403-203addf7c549\",\"states\":[{\"id\":\"s-1\",\"code\":\"EXPECTED\",\"internal_label\":\"Expected\",\"customer_label\":\"Expected\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":0},{\"id\":\"s-2\",\"code\":\"IN_TRANSIT_TO_TERMINAL\",\"internal_label\":\"In transit to terminal\",\"customer_label\":\"In transit to terminal\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":1},{\"id\":\"s-3\",\"code\":\"ARRIVED_AT_GATE\",\"internal_label\":\"Arrived at gate\",\"customer_label\":\"Arrived at terminal\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":2},{\"id\":\"s-4\",\"code\":\"RECEIVED\",\"internal_label\":\"Received\",\"customer_label\":\"Received\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":3},{\"id\":\"s-5\",\"code\":\"STORED\",\"internal_label\":\"Stored\",\"customer_label\":\"In storage\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":4},{\"id\":\"s-6\",\"code\":\"DOCS_IN_PROGRESS\",\"internal_label\":\"Documentation in progress\",\"customer_label\":\"Documentation in progress\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":5},{\"id\":\"s-7\",\"code\":\"EXAMINATION_SCHEDULED\",\"internal_label\":\"Examination scheduled\",\"customer_label\":\"Examination scheduled\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":6},{\"id\":\"s-8\",\"code\":\"UNDER_EXAMINATION\",\"internal_label\":\"Under examination\",\"customer_label\":\"Under examination\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":7},{\"id\":\"s-9\",\"code\":\"EXAMINATION_COMPLETE\",\"internal_label\":\"Examination complete\",\"customer_label\":\"Examination complete\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":8},{\"id\":\"s-10\",\"code\":\"HELD\",\"internal_label\":\"Held\",\"customer_label\":\"On hold — contact operations\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":9},{\"id\":\"s-11\",\"code\":\"CHARGES_PENDING\",\"internal_label\":\"Charges pending\",\"customer_label\":\"Charges pending\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":10},{\"id\":\"s-12\",\"code\":\"CHARGES_SETTLED\",\"internal_label\":\"Charges settled\",\"customer_label\":\"Charges settled\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":11},{\"id\":\"s-13\",\"code\":\"RELEASE_AUTHORISED\",\"internal_label\":\"Release authorised\",\"customer_label\":\"Released for collection\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":12},{\"id\":\"s-14\",\"code\":\"SLOT_BOOKED\",\"internal_label\":\"Slot booked\",\"customer_label\":\"Collection booked\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":13},{\"id\":\"s-15\",\"code\":\"LOADING\",\"internal_label\":\"Loading\",\"customer_label\":\"Loading\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":14},{\"id\":\"s-16\",\"code\":\"GATE_OUT\",\"internal_label\":\"Gate out\",\"customer_label\":\"Collected\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":15},{\"id\":\"s-17\",\"code\":\"CLOSED\",\"internal_label\":\"Closed\",\"customer_label\":\"Closed\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":16},{\"id\":\"s-18\",\"code\":\"OVERSTAYED\",\"internal_label\":\"Overstayed\",\"customer_label\":\"Overstayed — action required\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":17},{\"id\":\"s-19\",\"code\":\"TRANSFERRED_OUT\",\"internal_label\":\"Transferred out\",\"customer_label\":\"Transferred\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":18},{\"id\":\"s-20\",\"code\":\"RETURNED_RE_EXPORTED\",\"internal_label\":\"Returned / Re-exported\",\"customer_label\":\"Returned / Re-exported\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":19}],\"transitions\":[{\"id\":\"t-1\",\"from\":\"EXPECTED\",\"to\":\"IN_TRANSIT_TO_TERMINAL\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":0},{\"id\":\"t-2\",\"from\":\"IN_TRANSIT_TO_TERMINAL\",\"to\":\"ARRIVED_AT_GATE\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":1},{\"id\":\"t-3\",\"from\":\"ARRIVED_AT_GATE\",\"to\":\"RECEIVED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":2},{\"id\":\"t-4\",\"from\":\"RECEIVED\",\"to\":\"STORED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":3},{\"id\":\"t-5\",\"from\":\"STORED\",\"to\":\"DOCS_IN_PROGRESS\",\"requires_hold_clear\":0,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":4},{\"id\":\"t-6\",\"from\":\"DOCS_IN_PROGRESS\",\"to\":\"EXAMINATION_SCHEDULED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":5},{\"id\":\"t-7\",\"from\":\"EXAMINATION_SCHEDULED\",\"to\":\"UNDER_EXAMINATION\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":6},{\"id\":\"t-8\",\"from\":\"UNDER_EXAMINATION\",\"to\":\"EXAMINATION_COMPLETE\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":7},{\"id\":\"t-9\",\"from\":\"EXAMINATION_COMPLETE\",\"to\":\"CHARGES_PENDING\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":8},{\"id\":\"t-10\",\"from\":\"CHARGES_PENDING\",\"to\":\"CHARGES_SETTLED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":9},{\"id\":\"t-11\",\"from\":\"CHARGES_SETTLED\",\"to\":\"RELEASE_AUTHORISED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":10},{\"id\":\"t-12\",\"from\":\"RELEASE_AUTHORISED\",\"to\":\"SLOT_BOOKED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":11},{\"id\":\"t-13\",\"from\":\"SLOT_BOOKED\",\"to\":\"LOADING\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":0,\"active\":1,\"sort_order\":12},{\"id\":\"t-14\",\"from\":\"LOADING\",\"to\":\"GATE_OUT\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":13},{\"id\":\"t-15\",\"from\":\"GATE_OUT\",\"to\":\"CLOSED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":0,\"active\":1,\"sort_order\":14}],\"hold_policies\":[{\"id\":\"h-1\",\"type\":\"Customs\",\"authority_required\":1,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":0},{\"id\":\"h-2\",\"type\":\"Agency\",\"authority_required\":1,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":1},{\"id\":\"h-3\",\"type\":\"Terminal\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":2},{\"id\":\"h-4\",\"type\":\"Financial\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":3},{\"id\":\"h-5\",\"type\":\"Damage\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":4},{\"id\":\"h-6\",\"type\":\"Documentation\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":5}],\"behaviour\":{\"auto_notify_on_transition\":true,\"allow_bulk_transitions\":true,\"split_merge_preserves_lineage\":true,\"pause_storage_on_hold\":false,\"track_container_level\":true,\"track_package_level\":true},\"settings\":{\"auto_notify_on_transition\":1,\"allow_bulk_transitions\":1,\"split_merge_preserves_lineage\":1,\"pause_storage_on_hold\":0,\"track_container_level\":1,\"track_package_level\":1,\"require_docs_for_release\":1,\"require_no_active_holds\":1,\"require_financial_clearance\":1,\"allow_approved_credit_or_waiver\":0,\"require_gate_verification\":1}}','e313f9d3-9f0d-464c-a5e6-e8c8f9f6a12d','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-09 18:59:45'),('5539b048-1891-42a9-bceb-d87207649ce6','4c72c051-2d7d-44fa-a85c-be6a57d3c039','c0654f0b-8452-4a03-a43d-0d0cda17da1b','CARGO_CONFIGURATION_UPDATED','Cargo lifecycle configuration updated','{\"version_id\":\"69ef53ae-6187-4ac2-9bfa-4210190ae49d\",\"states\":[{\"id\":\"s-1\",\"code\":\"EXPECTED\",\"internal_label\":\"Expected\",\"customer_label\":\"Expected\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":1},{\"id\":\"s-2\",\"code\":\"IN_TRANSIT_TO_TERMINAL\",\"internal_label\":\"In transit to terminal\",\"customer_label\":\"In transit to terminal\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":2},{\"id\":\"s-3\",\"code\":\"ARRIVED_AT_GATE\",\"internal_label\":\"Arrived at gate\",\"customer_label\":\"Arrived at terminal\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":3},{\"id\":\"s-4\",\"code\":\"RECEIVED\",\"internal_label\":\"Received\",\"customer_label\":\"Received\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":4},{\"id\":\"s-5\",\"code\":\"STORED\",\"internal_label\":\"Stored\",\"customer_label\":\"In storage\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":5},{\"id\":\"s-6\",\"code\":\"DOCS_IN_PROGRESS\",\"internal_label\":\"Documentation in progress\",\"customer_label\":\"Documentation in progress\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":6},{\"id\":\"s-7\",\"code\":\"EXAMINATION_SCHEDULED\",\"internal_label\":\"Examination scheduled\",\"customer_label\":\"Examination scheduled\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":7},{\"id\":\"s-8\",\"code\":\"UNDER_EXAMINATION\",\"internal_label\":\"Under examination\",\"customer_label\":\"Under examination\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":8},{\"id\":\"s-9\",\"code\":\"EXAMINATION_COMPLETE\",\"internal_label\":\"Examination complete\",\"customer_label\":\"Examination complete\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":9},{\"id\":\"s-10\",\"code\":\"HELD\",\"internal_label\":\"Held\",\"customer_label\":\"On hold — contact operations\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":10},{\"id\":\"s-11\",\"code\":\"CHARGES_PENDING\",\"internal_label\":\"Charges pending\",\"customer_label\":\"Charges pending\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":11},{\"id\":\"s-12\",\"code\":\"CHARGES_SETTLED\",\"internal_label\":\"Charges settled\",\"customer_label\":\"Charges settled\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":12},{\"id\":\"s-13\",\"code\":\"RELEASE_AUTHORISED\",\"internal_label\":\"Release authorised\",\"customer_label\":\"Released for collection\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":13},{\"id\":\"s-14\",\"code\":\"SLOT_BOOKED\",\"internal_label\":\"Slot booked\",\"customer_label\":\"Collection booked\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":14},{\"id\":\"s-15\",\"code\":\"LOADING\",\"internal_label\":\"Loading\",\"customer_label\":\"Loading\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":15},{\"id\":\"s-16\",\"code\":\"GATE_OUT\",\"internal_label\":\"Gate out\",\"customer_label\":\"Collected\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":16},{\"id\":\"s-17\",\"code\":\"CLOSED\",\"internal_label\":\"Closed\",\"customer_label\":\"Closed\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":17},{\"id\":\"s-18\",\"code\":\"OVERSTAYED\",\"internal_label\":\"Overstayed\",\"customer_label\":\"Overstayed — action required\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":18},{\"id\":\"s-19\",\"code\":\"TRANSFERRED_OUT\",\"internal_label\":\"Transferred out\",\"customer_label\":\"Transferred\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":19},{\"id\":\"s-20\",\"code\":\"RETURNED_RE_EXPORTED\",\"internal_label\":\"Returned / Re-exported\",\"customer_label\":\"Returned / Re-exported\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":20}],\"transitions\":[{\"id\":\"t-1\",\"from\":\"EXPECTED\",\"to\":\"IN_TRANSIT_TO_TERMINAL\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":1},{\"id\":\"t-2\",\"from\":\"IN_TRANSIT_TO_TERMINAL\",\"to\":\"ARRIVED_AT_GATE\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":2},{\"id\":\"t-3\",\"from\":\"ARRIVED_AT_GATE\",\"to\":\"RECEIVED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":3},{\"id\":\"t-4\",\"from\":\"RECEIVED\",\"to\":\"STORED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":4},{\"id\":\"t-5\",\"from\":\"STORED\",\"to\":\"DOCS_IN_PROGRESS\",\"requires_hold_clear\":0,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":5},{\"id\":\"t-6\",\"from\":\"DOCS_IN_PROGRESS\",\"to\":\"EXAMINATION_SCHEDULED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":6},{\"id\":\"t-7\",\"from\":\"EXAMINATION_SCHEDULED\",\"to\":\"UNDER_EXAMINATION\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":7},{\"id\":\"t-8\",\"from\":\"UNDER_EXAMINATION\",\"to\":\"EXAMINATION_COMPLETE\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":8},{\"id\":\"t-9\",\"from\":\"EXAMINATION_COMPLETE\",\"to\":\"CHARGES_PENDING\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":9},{\"id\":\"t-10\",\"from\":\"CHARGES_PENDING\",\"to\":\"CHARGES_SETTLED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":10},{\"id\":\"t-11\",\"from\":\"CHARGES_SETTLED\",\"to\":\"RELEASE_AUTHORISED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":11},{\"id\":\"t-12\",\"from\":\"RELEASE_AUTHORISED\",\"to\":\"SLOT_BOOKED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":12},{\"id\":\"t-13\",\"from\":\"SLOT_BOOKED\",\"to\":\"LOADING\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":0,\"active\":1,\"sort_order\":13},{\"id\":\"t-14\",\"from\":\"LOADING\",\"to\":\"GATE_OUT\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":14},{\"id\":\"t-15\",\"from\":\"GATE_OUT\",\"to\":\"CLOSED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":0,\"active\":1,\"sort_order\":15}],\"hold_policies\":[{\"id\":\"h-1\",\"type\":\"Customs\",\"authority_required\":1,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":1},{\"id\":\"h-2\",\"type\":\"Agency\",\"authority_required\":1,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":2},{\"id\":\"h-3\",\"type\":\"Terminal\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":3},{\"id\":\"h-4\",\"type\":\"Financial\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":4},{\"id\":\"h-5\",\"type\":\"Damage\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":5},{\"id\":\"h-6\",\"type\":\"Documentation\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":6}],\"behaviour\":{\"auto_notify_on_transition\":true,\"allow_bulk_transitions\":true,\"split_merge_preserves_lineage\":true,\"pause_storage_on_hold\":false,\"track_container_level\":true,\"track_package_level\":true},\"settings\":{\"auto_notify_on_transition\":1,\"allow_bulk_transitions\":1,\"split_merge_preserves_lineage\":1,\"pause_storage_on_hold\":0,\"track_container_level\":1,\"track_package_level\":1,\"require_docs_for_release\":1,\"require_no_active_holds\":1,\"require_financial_clearance\":1,\"allow_approved_credit_or_waiver\":1,\"require_gate_verification\":1}}','{\"version_id\":\"4c72c051-2d7d-44fa-a85c-be6a57d3c039\",\"states\":[{\"id\":\"s-1\",\"code\":\"EXPECTED\",\"internal_label\":\"Expected\",\"customer_label\":\"Expected\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":0},{\"id\":\"s-2\",\"code\":\"IN_TRANSIT_TO_TERMINAL\",\"internal_label\":\"In transit to terminal\",\"customer_label\":\"In transit to terminal\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":1},{\"id\":\"s-3\",\"code\":\"ARRIVED_AT_GATE\",\"internal_label\":\"Arrived at gate\",\"customer_label\":\"Arrived at terminal\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":2},{\"id\":\"s-4\",\"code\":\"RECEIVED\",\"internal_label\":\"Received\",\"customer_label\":\"Received\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":3},{\"id\":\"s-5\",\"code\":\"STORED\",\"internal_label\":\"Stored\",\"customer_label\":\"In storage\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":4},{\"id\":\"s-6\",\"code\":\"DOCS_IN_PROGRESS\",\"internal_label\":\"Documentation in progress\",\"customer_label\":\"Documentation in progress\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":5},{\"id\":\"s-7\",\"code\":\"EXAMINATION_SCHEDULED\",\"internal_label\":\"Examination scheduled\",\"customer_label\":\"Examination scheduled\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":6},{\"id\":\"s-8\",\"code\":\"UNDER_EXAMINATION\",\"internal_label\":\"Under examination\",\"customer_label\":\"Under examination\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":7},{\"id\":\"s-9\",\"code\":\"EXAMINATION_COMPLETE\",\"internal_label\":\"Examination complete\",\"customer_label\":\"Examination complete\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":8},{\"id\":\"s-10\",\"code\":\"HELD\",\"internal_label\":\"Held\",\"customer_label\":\"On hold — contact operations\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":9},{\"id\":\"s-11\",\"code\":\"CHARGES_PENDING\",\"internal_label\":\"Charges pending\",\"customer_label\":\"Charges pending\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":10},{\"id\":\"s-12\",\"code\":\"CHARGES_SETTLED\",\"internal_label\":\"Charges settled\",\"customer_label\":\"Charges settled\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":11},{\"id\":\"s-13\",\"code\":\"RELEASE_AUTHORISED\",\"internal_label\":\"Release authorised\",\"customer_label\":\"Released for collection\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":12},{\"id\":\"s-14\",\"code\":\"SLOT_BOOKED\",\"internal_label\":\"Slot booked\",\"customer_label\":\"Collection booked\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":13},{\"id\":\"s-15\",\"code\":\"LOADING\",\"internal_label\":\"Loading\",\"customer_label\":\"Loading\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":14},{\"id\":\"s-16\",\"code\":\"GATE_OUT\",\"internal_label\":\"Gate out\",\"customer_label\":\"Collected\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":15},{\"id\":\"s-17\",\"code\":\"CLOSED\",\"internal_label\":\"Closed\",\"customer_label\":\"Closed\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":16},{\"id\":\"s-18\",\"code\":\"OVERSTAYED\",\"internal_label\":\"Overstayed\",\"customer_label\":\"Overstayed — action required\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":17},{\"id\":\"s-19\",\"code\":\"TRANSFERRED_OUT\",\"internal_label\":\"Transferred out\",\"customer_label\":\"Transferred\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":18},{\"id\":\"s-20\",\"code\":\"RETURNED_RE_EXPORTED\",\"internal_label\":\"Returned / Re-exported\",\"customer_label\":\"Returned / Re-exported\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":19}],\"transitions\":[{\"id\":\"t-1\",\"from\":\"EXPECTED\",\"to\":\"IN_TRANSIT_TO_TERMINAL\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":0},{\"id\":\"t-2\",\"from\":\"IN_TRANSIT_TO_TERMINAL\",\"to\":\"ARRIVED_AT_GATE\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":1},{\"id\":\"t-3\",\"from\":\"ARRIVED_AT_GATE\",\"to\":\"RECEIVED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":2},{\"id\":\"t-4\",\"from\":\"RECEIVED\",\"to\":\"STORED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":3},{\"id\":\"t-5\",\"from\":\"STORED\",\"to\":\"DOCS_IN_PROGRESS\",\"requires_hold_clear\":0,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":4},{\"id\":\"t-6\",\"from\":\"DOCS_IN_PROGRESS\",\"to\":\"EXAMINATION_SCHEDULED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":5},{\"id\":\"t-7\",\"from\":\"EXAMINATION_SCHEDULED\",\"to\":\"UNDER_EXAMINATION\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":6},{\"id\":\"t-8\",\"from\":\"UNDER_EXAMINATION\",\"to\":\"EXAMINATION_COMPLETE\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":7},{\"id\":\"t-9\",\"from\":\"EXAMINATION_COMPLETE\",\"to\":\"CHARGES_PENDING\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":8},{\"id\":\"t-10\",\"from\":\"CHARGES_PENDING\",\"to\":\"CHARGES_SETTLED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":9},{\"id\":\"t-11\",\"from\":\"CHARGES_SETTLED\",\"to\":\"RELEASE_AUTHORISED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":10},{\"id\":\"t-12\",\"from\":\"RELEASE_AUTHORISED\",\"to\":\"SLOT_BOOKED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":11},{\"id\":\"t-13\",\"from\":\"SLOT_BOOKED\",\"to\":\"LOADING\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":0,\"active\":1,\"sort_order\":12},{\"id\":\"t-14\",\"from\":\"LOADING\",\"to\":\"GATE_OUT\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":13},{\"id\":\"t-15\",\"from\":\"GATE_OUT\",\"to\":\"CLOSED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":0,\"active\":1,\"sort_order\":14}],\"hold_policies\":[{\"id\":\"h-1\",\"type\":\"Customs\",\"authority_required\":1,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":0},{\"id\":\"h-2\",\"type\":\"Agency\",\"authority_required\":1,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":1},{\"id\":\"h-3\",\"type\":\"Terminal\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":2},{\"id\":\"h-4\",\"type\":\"Financial\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":3},{\"id\":\"h-5\",\"type\":\"Damage\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":4},{\"id\":\"h-6\",\"type\":\"Documentation\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":5}],\"behaviour\":{\"auto_notify_on_transition\":true,\"allow_bulk_transitions\":true,\"split_merge_preserves_lineage\":true,\"pause_storage_on_hold\":false,\"track_container_level\":true,\"track_package_level\":true},\"settings\":{\"auto_notify_on_transition\":1,\"allow_bulk_transitions\":1,\"split_merge_preserves_lineage\":1,\"pause_storage_on_hold\":0,\"track_container_level\":1,\"track_package_level\":1,\"require_docs_for_release\":1,\"require_no_active_holds\":1,\"require_financial_clearance\":1,\"allow_approved_credit_or_waiver\":0,\"require_gate_verification\":1}}','544751a7-5f48-41ee-9ad0-a6ef630d09ce','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-09 18:59:03'),('638814b4-b597-4617-ad4e-01db67a18dfd','26e9b717-671d-4b6c-b548-13b1145dbb82','c0654f0b-8452-4a03-a43d-0d0cda17da1b','CARGO_CONFIGURATION_UPDATED','Cargo lifecycle configuration updated','{\"version_id\":\"4c72c051-2d7d-44fa-a85c-be6a57d3c039\",\"states\":[{\"id\":\"s-1\",\"code\":\"EXPECTED\",\"internal_label\":\"Expected\",\"customer_label\":\"Expected\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":0},{\"id\":\"s-2\",\"code\":\"IN_TRANSIT_TO_TERMINAL\",\"internal_label\":\"In transit to terminal\",\"customer_label\":\"In transit to terminal\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":1},{\"id\":\"s-3\",\"code\":\"ARRIVED_AT_GATE\",\"internal_label\":\"Arrived at gate\",\"customer_label\":\"Arrived at terminal\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":2},{\"id\":\"s-4\",\"code\":\"RECEIVED\",\"internal_label\":\"Received\",\"customer_label\":\"Received\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":3},{\"id\":\"s-5\",\"code\":\"STORED\",\"internal_label\":\"Stored\",\"customer_label\":\"In storage\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":4},{\"id\":\"s-6\",\"code\":\"DOCS_IN_PROGRESS\",\"internal_label\":\"Documentation in progress\",\"customer_label\":\"Documentation in progress\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":5},{\"id\":\"s-7\",\"code\":\"EXAMINATION_SCHEDULED\",\"internal_label\":\"Examination scheduled\",\"customer_label\":\"Examination scheduled\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":6},{\"id\":\"s-8\",\"code\":\"UNDER_EXAMINATION\",\"internal_label\":\"Under examination\",\"customer_label\":\"Under examination\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":7},{\"id\":\"s-9\",\"code\":\"EXAMINATION_COMPLETE\",\"internal_label\":\"Examination complete\",\"customer_label\":\"Examination complete\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":8},{\"id\":\"s-10\",\"code\":\"HELD\",\"internal_label\":\"Held\",\"customer_label\":\"On hold — contact operations\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":9},{\"id\":\"s-11\",\"code\":\"CHARGES_PENDING\",\"internal_label\":\"Charges pending\",\"customer_label\":\"Charges pending\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":10},{\"id\":\"s-12\",\"code\":\"CHARGES_SETTLED\",\"internal_label\":\"Charges settled\",\"customer_label\":\"Charges settled\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":11},{\"id\":\"s-13\",\"code\":\"RELEASE_AUTHORISED\",\"internal_label\":\"Release authorised\",\"customer_label\":\"Released for collection\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":12},{\"id\":\"s-14\",\"code\":\"SLOT_BOOKED\",\"internal_label\":\"Slot booked\",\"customer_label\":\"Collection booked\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":13},{\"id\":\"s-15\",\"code\":\"LOADING\",\"internal_label\":\"Loading\",\"customer_label\":\"Loading\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":14},{\"id\":\"s-16\",\"code\":\"GATE_OUT\",\"internal_label\":\"Gate out\",\"customer_label\":\"Collected\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":15},{\"id\":\"s-17\",\"code\":\"CLOSED\",\"internal_label\":\"Closed\",\"customer_label\":\"Closed\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":16},{\"id\":\"s-18\",\"code\":\"OVERSTAYED\",\"internal_label\":\"Overstayed\",\"customer_label\":\"Overstayed — action required\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":17},{\"id\":\"s-19\",\"code\":\"TRANSFERRED_OUT\",\"internal_label\":\"Transferred out\",\"customer_label\":\"Transferred\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":18},{\"id\":\"s-20\",\"code\":\"RETURNED_RE_EXPORTED\",\"internal_label\":\"Returned / Re-exported\",\"customer_label\":\"Returned / Re-exported\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":19}],\"transitions\":[{\"id\":\"t-1\",\"from\":\"EXPECTED\",\"to\":\"IN_TRANSIT_TO_TERMINAL\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":0},{\"id\":\"t-2\",\"from\":\"IN_TRANSIT_TO_TERMINAL\",\"to\":\"ARRIVED_AT_GATE\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":1},{\"id\":\"t-3\",\"from\":\"ARRIVED_AT_GATE\",\"to\":\"RECEIVED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":2},{\"id\":\"t-4\",\"from\":\"RECEIVED\",\"to\":\"STORED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":3},{\"id\":\"t-5\",\"from\":\"STORED\",\"to\":\"DOCS_IN_PROGRESS\",\"requires_hold_clear\":0,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":4},{\"id\":\"t-6\",\"from\":\"DOCS_IN_PROGRESS\",\"to\":\"EXAMINATION_SCHEDULED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":5},{\"id\":\"t-7\",\"from\":\"EXAMINATION_SCHEDULED\",\"to\":\"UNDER_EXAMINATION\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":6},{\"id\":\"t-8\",\"from\":\"UNDER_EXAMINATION\",\"to\":\"EXAMINATION_COMPLETE\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":7},{\"id\":\"t-9\",\"from\":\"EXAMINATION_COMPLETE\",\"to\":\"CHARGES_PENDING\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":8},{\"id\":\"t-10\",\"from\":\"CHARGES_PENDING\",\"to\":\"CHARGES_SETTLED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":9},{\"id\":\"t-11\",\"from\":\"CHARGES_SETTLED\",\"to\":\"RELEASE_AUTHORISED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":10},{\"id\":\"t-12\",\"from\":\"RELEASE_AUTHORISED\",\"to\":\"SLOT_BOOKED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":11},{\"id\":\"t-13\",\"from\":\"SLOT_BOOKED\",\"to\":\"LOADING\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":0,\"active\":1,\"sort_order\":12},{\"id\":\"t-14\",\"from\":\"LOADING\",\"to\":\"GATE_OUT\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":13},{\"id\":\"t-15\",\"from\":\"GATE_OUT\",\"to\":\"CLOSED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":0,\"active\":1,\"sort_order\":14}],\"hold_policies\":[{\"id\":\"h-1\",\"type\":\"Customs\",\"authority_required\":1,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":0},{\"id\":\"h-2\",\"type\":\"Agency\",\"authority_required\":1,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":1},{\"id\":\"h-3\",\"type\":\"Terminal\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":2},{\"id\":\"h-4\",\"type\":\"Financial\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":3},{\"id\":\"h-5\",\"type\":\"Damage\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":4},{\"id\":\"h-6\",\"type\":\"Documentation\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":5}],\"behaviour\":{\"auto_notify_on_transition\":true,\"allow_bulk_transitions\":true,\"split_merge_preserves_lineage\":true,\"pause_storage_on_hold\":false,\"track_container_level\":true,\"track_package_level\":true},\"settings\":{\"auto_notify_on_transition\":1,\"allow_bulk_transitions\":1,\"split_merge_preserves_lineage\":1,\"pause_storage_on_hold\":0,\"track_container_level\":1,\"track_package_level\":1,\"require_docs_for_release\":1,\"require_no_active_holds\":1,\"require_financial_clearance\":1,\"allow_approved_credit_or_waiver\":0,\"require_gate_verification\":1}}','{\"version_id\":\"26e9b717-671d-4b6c-b548-13b1145dbb82\",\"states\":[{\"id\":\"s-1\",\"code\":\"EXPECTED\",\"internal_label\":\"Expected\",\"customer_label\":\"Expected\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":0},{\"id\":\"s-2\",\"code\":\"IN_TRANSIT_TO_TERMINAL\",\"internal_label\":\"In transit to terminal\",\"customer_label\":\"In transit to terminal\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":1},{\"id\":\"s-3\",\"code\":\"ARRIVED_AT_GATE\",\"internal_label\":\"Arrived at gate\",\"customer_label\":\"Arrived at terminal\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":2},{\"id\":\"s-4\",\"code\":\"RECEIVED\",\"internal_label\":\"Received\",\"customer_label\":\"Received\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":3},{\"id\":\"s-5\",\"code\":\"STORED\",\"internal_label\":\"Stored\",\"customer_label\":\"In storage\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":4},{\"id\":\"s-6\",\"code\":\"DOCS_IN_PROGRESS\",\"internal_label\":\"Documentation in progress\",\"customer_label\":\"Documentation in progress\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":5},{\"id\":\"s-7\",\"code\":\"EXAMINATION_SCHEDULED\",\"internal_label\":\"Examination scheduled\",\"customer_label\":\"Examination scheduled\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":6},{\"id\":\"s-8\",\"code\":\"UNDER_EXAMINATION\",\"internal_label\":\"Under examination\",\"customer_label\":\"Under examination\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":7},{\"id\":\"s-9\",\"code\":\"EXAMINATION_COMPLETE\",\"internal_label\":\"Examination complete\",\"customer_label\":\"Examination complete\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":8},{\"id\":\"s-10\",\"code\":\"HELD\",\"internal_label\":\"Held\",\"customer_label\":\"On hold — contact operations\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":9},{\"id\":\"s-11\",\"code\":\"CHARGES_PENDING\",\"internal_label\":\"Charges pending\",\"customer_label\":\"Charges pending\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":10},{\"id\":\"s-12\",\"code\":\"CHARGES_SETTLED\",\"internal_label\":\"Charges settled\",\"customer_label\":\"Charges settled\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":11},{\"id\":\"s-13\",\"code\":\"RELEASE_AUTHORISED\",\"internal_label\":\"Release authorised\",\"customer_label\":\"Released for collection\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":12},{\"id\":\"s-14\",\"code\":\"SLOT_BOOKED\",\"internal_label\":\"Slot booked\",\"customer_label\":\"Collection booked\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":13},{\"id\":\"s-15\",\"code\":\"LOADING\",\"internal_label\":\"Loading\",\"customer_label\":\"Loading\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":14},{\"id\":\"s-16\",\"code\":\"GATE_OUT\",\"internal_label\":\"Gate out\",\"customer_label\":\"Collected\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":15},{\"id\":\"s-17\",\"code\":\"CLOSED\",\"internal_label\":\"Closed\",\"customer_label\":\"Closed\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":16},{\"id\":\"s-18\",\"code\":\"OVERSTAYED\",\"internal_label\":\"Overstayed\",\"customer_label\":\"Overstayed — action required\",\"terminal\":0,\"active\":1,\"system\":1,\"sort_order\":17},{\"id\":\"s-19\",\"code\":\"TRANSFERRED_OUT\",\"internal_label\":\"Transferred out\",\"customer_label\":\"Transferred\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":18},{\"id\":\"s-20\",\"code\":\"RETURNED_RE_EXPORTED\",\"internal_label\":\"Returned / Re-exported\",\"customer_label\":\"Returned / Re-exported\",\"terminal\":1,\"active\":1,\"system\":1,\"sort_order\":19}],\"transitions\":[{\"id\":\"t-1\",\"from\":\"EXPECTED\",\"to\":\"IN_TRANSIT_TO_TERMINAL\",\"requires_hold_clear\":1,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":0},{\"id\":\"t-2\",\"from\":\"IN_TRANSIT_TO_TERMINAL\",\"to\":\"ARRIVED_AT_GATE\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":1},{\"id\":\"t-3\",\"from\":\"ARRIVED_AT_GATE\",\"to\":\"RECEIVED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":2},{\"id\":\"t-4\",\"from\":\"RECEIVED\",\"to\":\"STORED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":3},{\"id\":\"t-5\",\"from\":\"STORED\",\"to\":\"DOCS_IN_PROGRESS\",\"requires_hold_clear\":0,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":4},{\"id\":\"t-6\",\"from\":\"DOCS_IN_PROGRESS\",\"to\":\"EXAMINATION_SCHEDULED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":5},{\"id\":\"t-7\",\"from\":\"EXAMINATION_SCHEDULED\",\"to\":\"UNDER_EXAMINATION\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":6},{\"id\":\"t-8\",\"from\":\"UNDER_EXAMINATION\",\"to\":\"EXAMINATION_COMPLETE\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":7},{\"id\":\"t-9\",\"from\":\"EXAMINATION_COMPLETE\",\"to\":\"CHARGES_PENDING\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":8},{\"id\":\"t-10\",\"from\":\"CHARGES_PENDING\",\"to\":\"CHARGES_SETTLED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":1,\"active\":1,\"sort_order\":9},{\"id\":\"t-11\",\"from\":\"CHARGES_SETTLED\",\"to\":\"RELEASE_AUTHORISED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":10},{\"id\":\"t-12\",\"from\":\"RELEASE_AUTHORISED\",\"to\":\"SLOT_BOOKED\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":11},{\"id\":\"t-13\",\"from\":\"SLOT_BOOKED\",\"to\":\"LOADING\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":0,\"active\":1,\"sort_order\":12},{\"id\":\"t-14\",\"from\":\"LOADING\",\"to\":\"GATE_OUT\",\"requires_hold_clear\":1,\"requires_docs\":1,\"requires_financial_clearance\":1,\"requires_authority_reference\":1,\"notifies\":1,\"active\":1,\"sort_order\":13},{\"id\":\"t-15\",\"from\":\"GATE_OUT\",\"to\":\"CLOSED\",\"requires_hold_clear\":0,\"requires_docs\":0,\"requires_financial_clearance\":0,\"requires_authority_reference\":0,\"notifies\":0,\"active\":1,\"sort_order\":14}],\"hold_policies\":[{\"id\":\"h-1\",\"type\":\"Customs\",\"authority_required\":1,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":0},{\"id\":\"h-2\",\"type\":\"Agency\",\"authority_required\":1,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":1},{\"id\":\"h-3\",\"type\":\"Terminal\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":2},{\"id\":\"h-4\",\"type\":\"Financial\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":3},{\"id\":\"h-5\",\"type\":\"Damage\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":4},{\"id\":\"h-6\",\"type\":\"Documentation\",\"authority_required\":0,\"reference_required\":1,\"release_reason_required\":1,\"enabled\":1,\"sort_order\":5}],\"behaviour\":{\"auto_notify_on_transition\":true,\"allow_bulk_transitions\":true,\"split_merge_preserves_lineage\":true,\"pause_storage_on_hold\":false,\"track_container_level\":true,\"track_package_level\":true},\"settings\":{\"auto_notify_on_transition\":1,\"allow_bulk_transitions\":1,\"split_merge_preserves_lineage\":1,\"pause_storage_on_hold\":0,\"track_container_level\":1,\"track_package_level\":1,\"require_docs_for_release\":1,\"require_no_active_holds\":1,\"require_financial_clearance\":1,\"allow_approved_credit_or_waiver\":0,\"require_gate_verification\":1}}','9d9b22c0-f88b-49a2-bbe1-da51950a535e','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-09 18:59:37'),('7efbeda7-1c98-4e0b-b31b-8fac309cf19f','69ef53ae-6187-4ac2-9bfa-4210190ae49d','system','CARGO_CONFIGURATION_INITIALISED','Initial cargo lifecycle configuration',NULL,'{\"states\":20,\"transitions\":15,\"hold_policies\":6,\"require_docs_for_release\":true,\"require_no_active_holds\":true,\"require_financial_clearance\":true,\"require_gate_verification\":true}','fd3fa212f00a55abce7ecc89c5cd8379','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-09 18:46:24');
/*!40000 ALTER TABLE `cargo_config_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cargo_config_versions`
--

DROP TABLE IF EXISTS `cargo_config_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cargo_config_versions` (
  `id` char(36) NOT NULL,
  `version_no` int(10) unsigned NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `change_reason` varchar(500) NOT NULL,
  `created_by` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cargo_config_version_no` (`version_no`),
  KEY `idx_cargo_config_current` (`is_current`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cargo_config_versions`
--

LOCK TABLES `cargo_config_versions` WRITE;
/*!40000 ALTER TABLE `cargo_config_versions` DISABLE KEYS */;
INSERT INTO `cargo_config_versions` VALUES ('26e9b717-671d-4b6c-b548-13b1145dbb82',3,0,'Cargo lifecycle configuration updated','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 18:59:37'),('4c72c051-2d7d-44fa-a85c-be6a57d3c039',2,0,'Cargo lifecycle configuration updated','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 18:59:03'),('69ef53ae-6187-4ac2-9bfa-4210190ae49d',1,0,'Initial cargo lifecycle configuration','system','2026-10-09 18:46:24'),('96dd9a2d-656d-47e3-a403-203addf7c549',4,1,'Cargo lifecycle configuration updated','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 18:59:45');
/*!40000 ALTER TABLE `cargo_config_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cargo_hold_policies`
--

DROP TABLE IF EXISTS `cargo_hold_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cargo_hold_policies` (
  `id` char(36) NOT NULL,
  `config_version_id` char(36) NOT NULL,
  `policy_key` varchar(80) NOT NULL,
  `hold_type` varchar(80) NOT NULL,
  `authority_required` tinyint(1) NOT NULL DEFAULT 0,
  `reference_required` tinyint(1) NOT NULL DEFAULT 1,
  `release_reason_required` tinyint(1) NOT NULL DEFAULT 1,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cargo_hold_policy_key_version` (`config_version_id`,`policy_key`),
  UNIQUE KEY `uq_cargo_hold_type_version` (`config_version_id`,`hold_type`),
  CONSTRAINT `fk_cargo_hold_policies_version` FOREIGN KEY (`config_version_id`) REFERENCES `cargo_config_versions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cargo_hold_policies`
--

LOCK TABLES `cargo_hold_policies` WRITE;
/*!40000 ALTER TABLE `cargo_hold_policies` DISABLE KEYS */;
INSERT INTO `cargo_hold_policies` VALUES ('01f25453-4176-44cc-87ae-2cfc6406b051','96dd9a2d-656d-47e3-a403-203addf7c549','h-3','Terminal',0,1,1,1,2),('1a58df45-c4da-42c5-8b22-5de46acf0ee1','96dd9a2d-656d-47e3-a403-203addf7c549','h-5','Damage',0,1,1,1,4),('24afd3cd-7da7-4b55-bf85-ec58bf355858','69ef53ae-6187-4ac2-9bfa-4210190ae49d','h-3','Terminal',0,1,1,1,3),('3331f35f-b69c-4354-a380-a42dd9c7dfe5','26e9b717-671d-4b6c-b548-13b1145dbb82','h-1','Customs',1,1,1,1,0),('38034873-dfcb-4056-ac20-59f58407a635','4c72c051-2d7d-44fa-a85c-be6a57d3c039','h-6','Documentation',0,1,1,1,5),('40fa8781-9a70-49da-a7bd-59d04e0060ad','4c72c051-2d7d-44fa-a85c-be6a57d3c039','h-4','Financial',0,1,1,1,3),('5134a6e2-121d-4b4c-a23a-17d296cec199','69ef53ae-6187-4ac2-9bfa-4210190ae49d','h-2','Agency',1,1,1,1,2),('5409bc6b-4411-426e-9937-153cd5de57f3','26e9b717-671d-4b6c-b548-13b1145dbb82','h-4','Financial',0,1,1,1,3),('63fa8a77-b259-4b97-84e1-3167a0bd35ee','69ef53ae-6187-4ac2-9bfa-4210190ae49d','h-6','Documentation',0,1,1,1,6),('64c450ce-9970-457c-bb83-b4fab824b4b2','26e9b717-671d-4b6c-b548-13b1145dbb82','h-2','Agency',1,1,1,1,1),('6d293850-e66a-49d2-8b2d-a9f66b08a33b','69ef53ae-6187-4ac2-9bfa-4210190ae49d','h-4','Financial',0,1,1,1,4),('80ca3b2a-5ef2-4d41-b026-4a96ddd4cbc8','69ef53ae-6187-4ac2-9bfa-4210190ae49d','h-1','Customs',1,1,1,1,1),('89b242ca-0549-410d-bb76-3b4d8d0f1b92','96dd9a2d-656d-47e3-a403-203addf7c549','h-4','Financial',0,1,1,1,3),('9915aa65-7b48-4cfc-b459-758e495c0a78','26e9b717-671d-4b6c-b548-13b1145dbb82','h-5','Damage',0,1,1,1,4),('a50c42ab-9574-4366-bb23-f89b6f0e399b','26e9b717-671d-4b6c-b548-13b1145dbb82','h-3','Terminal',0,1,1,1,2),('a59c4b89-3718-490f-97e4-88401c939d83','26e9b717-671d-4b6c-b548-13b1145dbb82','h-6','Documentation',0,1,1,1,5),('ab08cc40-181a-4aa3-afd1-1f2683f5e90f','4c72c051-2d7d-44fa-a85c-be6a57d3c039','h-1','Customs',1,1,1,1,0),('c7408e7f-f62f-43fe-b31c-3cc80a934ab3','96dd9a2d-656d-47e3-a403-203addf7c549','h-6','Documentation',0,1,1,1,5),('c86f5cb8-12f8-47b5-a293-cb8e317c23ac','4c72c051-2d7d-44fa-a85c-be6a57d3c039','h-5','Damage',0,1,1,1,4),('d1fa346c-fb5b-43ad-beaa-4b91fcc6fed3','69ef53ae-6187-4ac2-9bfa-4210190ae49d','h-5','Damage',0,1,1,1,5),('d2d20c2c-09e2-48e6-8bef-82cd1c2fafc7','96dd9a2d-656d-47e3-a403-203addf7c549','h-1','Customs',1,1,1,1,0),('ddd7e665-38a8-46a7-b1f4-e1b2d3b0f8f8','4c72c051-2d7d-44fa-a85c-be6a57d3c039','h-3','Terminal',0,1,1,1,2),('ecdac56d-04a0-4889-9b44-dfbae6d48ba3','4c72c051-2d7d-44fa-a85c-be6a57d3c039','h-2','Agency',1,1,1,1,1),('fb7d6dd5-f8e7-47c7-9d61-9d51bf326ed3','96dd9a2d-656d-47e3-a403-203addf7c549','h-2','Agency',1,1,1,1,1);
/*!40000 ALTER TABLE `cargo_hold_policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cargo_lifecycle_settings`
--

DROP TABLE IF EXISTS `cargo_lifecycle_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cargo_lifecycle_settings` (
  `config_version_id` char(36) NOT NULL,
  `auto_notify_on_transition` tinyint(1) NOT NULL DEFAULT 1,
  `allow_bulk_transitions` tinyint(1) NOT NULL DEFAULT 1,
  `split_merge_preserves_lineage` tinyint(1) NOT NULL DEFAULT 1,
  `pause_storage_on_hold` tinyint(1) NOT NULL DEFAULT 0,
  `track_container_level` tinyint(1) NOT NULL DEFAULT 1,
  `track_package_level` tinyint(1) NOT NULL DEFAULT 1,
  `require_docs_for_release` tinyint(1) NOT NULL DEFAULT 1,
  `require_no_active_holds` tinyint(1) NOT NULL DEFAULT 1,
  `require_financial_clearance` tinyint(1) NOT NULL DEFAULT 1,
  `allow_approved_credit_or_waiver` tinyint(1) NOT NULL DEFAULT 1,
  `require_gate_verification` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`config_version_id`),
  CONSTRAINT `fk_cargo_lifecycle_settings_version` FOREIGN KEY (`config_version_id`) REFERENCES `cargo_config_versions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cargo_lifecycle_settings`
--

LOCK TABLES `cargo_lifecycle_settings` WRITE;
/*!40000 ALTER TABLE `cargo_lifecycle_settings` DISABLE KEYS */;
INSERT INTO `cargo_lifecycle_settings` VALUES ('26e9b717-671d-4b6c-b548-13b1145dbb82',1,1,1,0,1,1,1,1,1,0,1),('4c72c051-2d7d-44fa-a85c-be6a57d3c039',1,1,1,0,1,1,1,1,1,0,1),('69ef53ae-6187-4ac2-9bfa-4210190ae49d',1,1,1,0,1,1,1,1,1,1,1),('96dd9a2d-656d-47e3-a403-203addf7c549',1,1,1,0,1,1,1,1,1,0,1);
/*!40000 ALTER TABLE `cargo_lifecycle_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cargo_states`
--

DROP TABLE IF EXISTS `cargo_states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cargo_states` (
  `id` char(36) NOT NULL,
  `config_version_id` char(36) NOT NULL,
  `state_key` varchar(80) NOT NULL,
  `code` varchar(80) NOT NULL,
  `internal_label` varchar(150) NOT NULL,
  `customer_label` varchar(150) NOT NULL,
  `terminal` tinyint(1) NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cargo_state_key_version` (`config_version_id`,`state_key`),
  UNIQUE KEY `uq_cargo_state_code_version` (`config_version_id`,`code`),
  CONSTRAINT `fk_cargo_states_version` FOREIGN KEY (`config_version_id`) REFERENCES `cargo_config_versions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cargo_states`
--

LOCK TABLES `cargo_states` WRITE;
/*!40000 ALTER TABLE `cargo_states` DISABLE KEYS */;
INSERT INTO `cargo_states` VALUES ('03a16b67-d1cc-4d09-8746-82c7cb027f0f','26e9b717-671d-4b6c-b548-13b1145dbb82','s-20','RETURNED_RE_EXPORTED','Returned / Re-exported','Returned / Re-exported',1,1,1,19),('04ad919b-aca6-4077-8391-4e6324fc575e','26e9b717-671d-4b6c-b548-13b1145dbb82','s-6','DOCS_IN_PROGRESS','Documentation in progress','Documentation in progress',0,1,1,5),('0553270e-950a-4f56-95cf-a31b95cbe8c9','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-8','UNDER_EXAMINATION','Under examination','Under examination',0,1,1,7),('0592cde6-586a-4500-be54-ce3edfc5e344','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-6','DOCS_IN_PROGRESS','Documentation in progress','Documentation in progress',0,1,1,5),('08d458d9-7b71-4bba-a8df-d0a807c452d8','26e9b717-671d-4b6c-b548-13b1145dbb82','s-11','CHARGES_PENDING','Charges pending','Charges pending',0,1,1,10),('091a0382-b373-470e-8c76-a3707249122e','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-16','GATE_OUT','Gate out','Collected',1,1,1,15),('092da9b0-f943-4994-8f11-316cc8360a4e','96dd9a2d-656d-47e3-a403-203addf7c549','s-10','HELD','Held','On hold — contact operations',0,1,1,9),('0b8abe41-e06a-4947-8e85-063ee53c95e3','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-5','STORED','Stored','In storage',0,1,1,4),('0b8f68db-bb26-4611-8513-64b477ec5a01','26e9b717-671d-4b6c-b548-13b1145dbb82','s-16','GATE_OUT','Gate out','Collected',1,1,1,15),('0b98f86d-ef94-4379-9515-429fea5802bb','96dd9a2d-656d-47e3-a403-203addf7c549','s-1','EXPECTED','Expected','Expected',0,1,1,0),('11be0b19-a562-4282-b262-ebcb88eabca4','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-4','RECEIVED','Received','Received',0,1,1,4),('16ed825a-2706-4729-b394-b52e4a86f23e','26e9b717-671d-4b6c-b548-13b1145dbb82','s-19','TRANSFERRED_OUT','Transferred out','Transferred',1,1,1,18),('198603b2-2830-48c8-a088-3de0e8fb8c0f','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-14','SLOT_BOOKED','Slot booked','Collection booked',0,1,1,14),('1dca1137-fd87-42a4-a262-5a086ffa8db0','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-10','HELD','Held','On hold — contact operations',0,1,1,10),('1fee3a8b-ab6a-4927-8311-bff20355950c','96dd9a2d-656d-47e3-a403-203addf7c549','s-8','UNDER_EXAMINATION','Under examination','Under examination',0,1,1,7),('2398210c-05e1-4813-887e-3bc91d8d4976','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-19','TRANSFERRED_OUT','Transferred out','Transferred',1,1,1,18),('23a05f16-31cc-48f7-a9d0-3fdafa937c97','96dd9a2d-656d-47e3-a403-203addf7c549','s-15','LOADING','Loading','Loading',0,1,1,14),('25065051-3470-4418-9256-874659ad92d6','26e9b717-671d-4b6c-b548-13b1145dbb82','s-15','LOADING','Loading','Loading',0,1,1,14),('2541af77-dfe4-4f7c-8f79-f9dffbde09e6','96dd9a2d-656d-47e3-a403-203addf7c549','s-17','CLOSED','Closed','Closed',1,1,1,16),('25ddc3dd-c6e3-47d1-8498-b5335bbd6a19','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-3','ARRIVED_AT_GATE','Arrived at gate','Arrived at terminal',0,1,1,3),('32b3b85c-c842-4a1d-aee3-303ef125c24a','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-16','GATE_OUT','Gate out','Collected',1,1,1,16),('391fb04b-d220-441d-ba21-4b01e179fb63','96dd9a2d-656d-47e3-a403-203addf7c549','s-2','IN_TRANSIT_TO_TERMINAL','In transit to terminal','In transit to terminal',0,1,1,1),('3e1ad699-94ce-4b20-acc2-cb849069b246','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-14','SLOT_BOOKED','Slot booked','Collection booked',0,1,1,13),('3eacc346-9d42-4c30-9321-507b4e469214','26e9b717-671d-4b6c-b548-13b1145dbb82','s-17','CLOSED','Closed','Closed',1,1,1,16),('4beb945f-1183-4186-ba2d-2924c92f19dd','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-15','LOADING','Loading','Loading',0,1,1,15),('507b7da9-eaa8-4d88-b682-d242e3a391a5','96dd9a2d-656d-47e3-a403-203addf7c549','s-14','SLOT_BOOKED','Slot booked','Collection booked',0,1,1,13),('50fe79bf-1846-48f0-b25d-a35aafa8fe75','96dd9a2d-656d-47e3-a403-203addf7c549','s-11','CHARGES_PENDING','Charges pending','Charges pending',0,1,1,10),('519b74d7-7a16-4101-9fa7-746d687ba832','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-20','RETURNED_RE_EXPORTED','Returned / Re-exported','Returned / Re-exported',1,1,1,19),('5343149e-eab2-4715-8380-15e174670fa3','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-8','UNDER_EXAMINATION','Under examination','Under examination',0,1,1,8),('589dcda6-f317-4fcb-8f46-05e3c60e8613','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-1','EXPECTED','Expected','Expected',0,1,1,0),('5a255b58-91a7-4a77-be3e-736a53821fb6','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-12','CHARGES_SETTLED','Charges settled','Charges settled',0,1,1,12),('6047affa-b83f-4ec8-acd7-0eeac1db04e6','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-11','CHARGES_PENDING','Charges pending','Charges pending',0,1,1,11),('6b56c1a6-2a81-4635-a8dd-d122592bd60b','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-7','EXAMINATION_SCHEDULED','Examination scheduled','Examination scheduled',0,1,1,7),('6dfc0957-fad8-4c3c-8499-d4b66532bd5d','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-11','CHARGES_PENDING','Charges pending','Charges pending',0,1,1,10),('71fe37f5-35ec-49ec-be33-7ca94c48448e','96dd9a2d-656d-47e3-a403-203addf7c549','s-13','RELEASE_AUTHORISED','Release authorised','Released for collection',0,1,1,12),('72a6396b-4b9b-4583-987a-7ac5b09c5e95','96dd9a2d-656d-47e3-a403-203addf7c549','s-12','CHARGES_SETTLED','Charges settled','Charges settled',0,1,1,11),('751b65ba-09a6-4368-a3ba-501a07e6bb15','96dd9a2d-656d-47e3-a403-203addf7c549','s-5','STORED','Stored','In storage',0,1,1,4),('77c4788e-c467-40f0-8268-2de5b61ce3bf','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-5','STORED','Stored','In storage',0,1,1,5),('7a4d9845-9a3a-4484-bd8d-2ae665408381','96dd9a2d-656d-47e3-a403-203addf7c549','s-4','RECEIVED','Received','Received',0,1,1,3),('7af3a82f-8291-4371-86e4-7f6f769e27eb','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-2','IN_TRANSIT_TO_TERMINAL','In transit to terminal','In transit to terminal',0,1,1,1),('7d4f020d-baeb-4ffc-b71c-8ebc172ce76d','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-15','LOADING','Loading','Loading',0,1,1,14),('84252d16-59c1-4df1-a882-e28c312e47bd','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-7','EXAMINATION_SCHEDULED','Examination scheduled','Examination scheduled',0,1,1,6),('897190ca-0b50-4e2e-8c40-c8a993603542','96dd9a2d-656d-47e3-a403-203addf7c549','s-6','DOCS_IN_PROGRESS','Documentation in progress','Documentation in progress',0,1,1,5),('8aeb946e-df86-4ec0-9bfd-025222fbf003','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-6','DOCS_IN_PROGRESS','Documentation in progress','Documentation in progress',0,1,1,6),('8ee748a9-74db-42f3-a681-b75e6b544587','26e9b717-671d-4b6c-b548-13b1145dbb82','s-7','EXAMINATION_SCHEDULED','Examination scheduled','Examination scheduled',0,1,1,6),('8f15f88c-658d-4bda-bc00-4fb362d6b826','96dd9a2d-656d-47e3-a403-203addf7c549','s-18','OVERSTAYED','Overstayed','Overstayed — action required',0,1,1,17),('93081730-482e-4731-ba2e-34d8f18e54b5','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-12','CHARGES_SETTLED','Charges settled','Charges settled',0,1,1,11),('96a6fe1f-168b-4de3-9eb7-5424f2380caa','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-20','RETURNED_RE_EXPORTED','Returned / Re-exported','Returned / Re-exported',1,1,1,20),('96a93aec-58ec-493a-a991-cae18888b6f7','26e9b717-671d-4b6c-b548-13b1145dbb82','s-13','RELEASE_AUTHORISED','Release authorised','Released for collection',0,1,1,12),('97cd879d-9fd1-4709-b7c9-a6a60c987992','26e9b717-671d-4b6c-b548-13b1145dbb82','s-4','RECEIVED','Received','Received',0,1,1,3),('9c0b88fc-84da-479a-b09f-f9476a1e574a','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-3','ARRIVED_AT_GATE','Arrived at gate','Arrived at terminal',0,1,1,2),('9c679e39-b1a4-4a34-b87c-84a186f57da2','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-4','RECEIVED','Received','Received',0,1,1,3),('9fb0df0c-14f3-4520-afa0-8bdf361603b9','96dd9a2d-656d-47e3-a403-203addf7c549','s-3','ARRIVED_AT_GATE','Arrived at gate','Arrived at terminal',0,1,1,2),('a3f34dfa-7436-4d9e-9900-b9a839c44cff','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-13','RELEASE_AUTHORISED','Release authorised','Released for collection',0,1,1,12),('a3f812fe-7e71-47c7-a3ae-43710200e8ab','96dd9a2d-656d-47e3-a403-203addf7c549','s-9','EXAMINATION_COMPLETE','Examination complete','Examination complete',0,1,1,8),('a765d45b-1892-4bea-ab19-156022804acc','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-17','CLOSED','Closed','Closed',1,1,1,17),('aa1f8e29-0a57-461c-8ac5-4b42a8962c83','26e9b717-671d-4b6c-b548-13b1145dbb82','s-14','SLOT_BOOKED','Slot booked','Collection booked',0,1,1,13),('ab412de7-7fc9-4a12-8ef9-5730351fdab5','26e9b717-671d-4b6c-b548-13b1145dbb82','s-5','STORED','Stored','In storage',0,1,1,4),('ad200b69-56e3-4ea7-b339-2fe998de5396','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-19','TRANSFERRED_OUT','Transferred out','Transferred',1,1,1,19),('af59bbf4-612c-4b94-87dc-bbf172014845','26e9b717-671d-4b6c-b548-13b1145dbb82','s-8','UNDER_EXAMINATION','Under examination','Under examination',0,1,1,7),('b28af2e6-472e-42ea-a6e6-e69cb3d65c26','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-2','IN_TRANSIT_TO_TERMINAL','In transit to terminal','In transit to terminal',0,1,1,2),('b4340cb0-3d2a-44f1-91ee-1cf8c493854f','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-18','OVERSTAYED','Overstayed','Overstayed — action required',0,1,1,17),('b8afd172-c0f9-4d2b-9468-28bacf9ddecb','26e9b717-671d-4b6c-b548-13b1145dbb82','s-12','CHARGES_SETTLED','Charges settled','Charges settled',0,1,1,11),('bc5e9f86-56bc-47f7-a685-141eb2c74376','26e9b717-671d-4b6c-b548-13b1145dbb82','s-3','ARRIVED_AT_GATE','Arrived at gate','Arrived at terminal',0,1,1,2),('bc65b65c-a9b0-4d95-b67c-f17ce0db5ae7','26e9b717-671d-4b6c-b548-13b1145dbb82','s-1','EXPECTED','Expected','Expected',0,1,1,0),('c0197cef-ddf8-429d-ae83-b005289568de','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-1','EXPECTED','Expected','Expected',0,1,1,1),('c0fc97a1-a6b6-4243-af97-23a7e1169494','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-9','EXAMINATION_COMPLETE','Examination complete','Examination complete',0,1,1,9),('c43541b6-676c-4524-a728-cdb000579a5e','26e9b717-671d-4b6c-b548-13b1145dbb82','s-9','EXAMINATION_COMPLETE','Examination complete','Examination complete',0,1,1,8),('cbfb0141-f2b4-4bde-801a-73f4130f2084','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-18','OVERSTAYED','Overstayed','Overstayed — action required',0,1,1,18),('d31b3237-a604-4d86-aaba-46d80127f24a','26e9b717-671d-4b6c-b548-13b1145dbb82','s-2','IN_TRANSIT_TO_TERMINAL','In transit to terminal','In transit to terminal',0,1,1,1),('d3a7aed3-a0e3-4a84-a1f8-f74e3944dad1','96dd9a2d-656d-47e3-a403-203addf7c549','s-7','EXAMINATION_SCHEDULED','Examination scheduled','Examination scheduled',0,1,1,6),('d5b87dcf-aeac-42ea-9648-c27479b1c649','69ef53ae-6187-4ac2-9bfa-4210190ae49d','s-13','RELEASE_AUTHORISED','Release authorised','Released for collection',0,1,1,13),('de0ac16b-a762-4e2e-aea3-7f976eb99f61','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-10','HELD','Held','On hold — contact operations',0,1,1,9),('deb28ba9-208c-4f0a-bbd3-ed613a788806','96dd9a2d-656d-47e3-a403-203addf7c549','s-20','RETURNED_RE_EXPORTED','Returned / Re-exported','Returned / Re-exported',1,1,1,19),('dfa5b1f0-c624-4d62-8f82-ef67e3031b39','96dd9a2d-656d-47e3-a403-203addf7c549','s-16','GATE_OUT','Gate out','Collected',1,1,1,15),('e2b21120-488a-49fe-8bb4-4a78ab2a62ff','26e9b717-671d-4b6c-b548-13b1145dbb82','s-18','OVERSTAYED','Overstayed','Overstayed — action required',0,1,1,17),('e5f886a4-27e1-4c9d-8a91-d5cf4b26db11','26e9b717-671d-4b6c-b548-13b1145dbb82','s-10','HELD','Held','On hold — contact operations',0,1,1,9),('ea73b50c-23d6-4b3b-bda4-7dae6af877e1','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-9','EXAMINATION_COMPLETE','Examination complete','Examination complete',0,1,1,8),('f2065e61-cefe-47b6-bd61-24f1147be914','4c72c051-2d7d-44fa-a85c-be6a57d3c039','s-17','CLOSED','Closed','Closed',1,1,1,16),('f5043639-de63-4592-963f-50e47123e96b','96dd9a2d-656d-47e3-a403-203addf7c549','s-19','TRANSFERRED_OUT','Transferred out','Transferred',1,1,1,18);
/*!40000 ALTER TABLE `cargo_states` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cargo_transitions`
--

DROP TABLE IF EXISTS `cargo_transitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cargo_transitions` (
  `id` char(36) NOT NULL,
  `config_version_id` char(36) NOT NULL,
  `rule_key` varchar(80) NOT NULL,
  `from_code` varchar(80) NOT NULL,
  `to_code` varchar(80) NOT NULL,
  `requires_hold_clear` tinyint(1) NOT NULL DEFAULT 1,
  `requires_docs` tinyint(1) NOT NULL DEFAULT 0,
  `requires_financial_clearance` tinyint(1) NOT NULL DEFAULT 0,
  `requires_authority_reference` tinyint(1) NOT NULL DEFAULT 0,
  `notifies` tinyint(1) NOT NULL DEFAULT 1,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cargo_transition_key_version` (`config_version_id`,`rule_key`),
  UNIQUE KEY `uq_cargo_transition_pair_version` (`config_version_id`,`from_code`,`to_code`),
  KEY `idx_cargo_transition_from_version` (`config_version_id`,`from_code`,`active`),
  CONSTRAINT `fk_cargo_transitions_version` FOREIGN KEY (`config_version_id`) REFERENCES `cargo_config_versions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cargo_transitions`
--

LOCK TABLES `cargo_transitions` WRITE;
/*!40000 ALTER TABLE `cargo_transitions` DISABLE KEYS */;
INSERT INTO `cargo_transitions` VALUES ('02d0af4e-925e-46b4-8221-3c4341249578','4c72c051-2d7d-44fa-a85c-be6a57d3c039','t-8','UNDER_EXAMINATION','EXAMINATION_COMPLETE',1,1,0,0,1,1,7),('02ee5d9a-ebbf-495f-af1c-36b6aa7ca3d0','96dd9a2d-656d-47e3-a403-203addf7c549','t-10','CHARGES_PENDING','CHARGES_SETTLED',1,1,0,0,1,1,9),('043fdf38-512e-41c9-9f17-3e539c2eee58','96dd9a2d-656d-47e3-a403-203addf7c549','t-12','RELEASE_AUTHORISED','SLOT_BOOKED',1,1,1,1,1,1,11),('066346e1-fd6b-4aa5-8c69-8fd8d7b60268','4c72c051-2d7d-44fa-a85c-be6a57d3c039','t-12','RELEASE_AUTHORISED','SLOT_BOOKED',1,1,1,1,1,1,11),('0c82524e-7f3e-4e52-8a0c-7fbc8909297c','96dd9a2d-656d-47e3-a403-203addf7c549','t-1','EXPECTED','IN_TRANSIT_TO_TERMINAL',0,0,0,0,1,1,0),('0d8f247b-f458-4ab4-b0cb-ae9f83e07ab7','26e9b717-671d-4b6c-b548-13b1145dbb82','t-6','DOCS_IN_PROGRESS','EXAMINATION_SCHEDULED',1,1,0,0,1,1,5),('10840549-065d-4334-a964-064300b087a0','26e9b717-671d-4b6c-b548-13b1145dbb82','t-15','GATE_OUT','CLOSED',0,0,0,0,0,1,14),('11b1fa7e-e98b-4bd3-b3a9-ac87c6f6acde','96dd9a2d-656d-47e3-a403-203addf7c549','t-6','DOCS_IN_PROGRESS','EXAMINATION_SCHEDULED',1,1,0,0,1,1,5),('17a00c28-d0c6-47c6-9692-392853392c57','96dd9a2d-656d-47e3-a403-203addf7c549','t-4','RECEIVED','STORED',0,0,0,0,1,1,3),('21980c99-5d12-470d-bdd7-f8713e094225','69ef53ae-6187-4ac2-9bfa-4210190ae49d','t-5','STORED','DOCS_IN_PROGRESS',0,1,0,0,1,1,5),('22d061cc-30e8-49be-b546-37c22322b351','4c72c051-2d7d-44fa-a85c-be6a57d3c039','t-9','EXAMINATION_COMPLETE','CHARGES_PENDING',1,1,0,0,1,1,8),('271f5e8d-11f4-42a1-9387-945dd70f3016','69ef53ae-6187-4ac2-9bfa-4210190ae49d','t-14','LOADING','GATE_OUT',1,1,1,1,1,1,14),('2c197a11-2ee5-4ec3-8074-5078e3517efd','4c72c051-2d7d-44fa-a85c-be6a57d3c039','t-10','CHARGES_PENDING','CHARGES_SETTLED',1,1,0,0,1,1,9),('2df9fc2f-e344-41e2-a691-821ac0963ace','96dd9a2d-656d-47e3-a403-203addf7c549','t-14','LOADING','GATE_OUT',1,1,1,1,1,1,13),('327b5d55-9b05-4ebc-b46e-06a887f80d22','96dd9a2d-656d-47e3-a403-203addf7c549','t-11','CHARGES_SETTLED','RELEASE_AUTHORISED',1,1,1,1,1,1,10),('33a71cf4-f24e-4b53-b4a3-ee10526f14df','26e9b717-671d-4b6c-b548-13b1145dbb82','t-3','ARRIVED_AT_GATE','RECEIVED',0,0,0,0,1,1,2),('34e4abc3-f20a-4405-a420-237ef2e39cec','69ef53ae-6187-4ac2-9bfa-4210190ae49d','t-2','IN_TRANSIT_TO_TERMINAL','ARRIVED_AT_GATE',0,0,0,0,1,1,2),('3d431ccb-342f-4493-ae1e-ea5f343f49ea','26e9b717-671d-4b6c-b548-13b1145dbb82','t-14','LOADING','GATE_OUT',1,1,1,1,1,1,13),('3ecb20f0-c782-4dbe-a55b-d74e48f5f27b','26e9b717-671d-4b6c-b548-13b1145dbb82','t-9','EXAMINATION_COMPLETE','CHARGES_PENDING',1,1,0,0,1,1,8),('3feae2a1-42c2-460c-8435-a566547cebe5','69ef53ae-6187-4ac2-9bfa-4210190ae49d','t-13','SLOT_BOOKED','LOADING',1,1,1,1,0,1,13),('42845d72-189e-43e9-8280-9fdf79018da3','69ef53ae-6187-4ac2-9bfa-4210190ae49d','t-9','EXAMINATION_COMPLETE','CHARGES_PENDING',1,1,0,0,1,1,9),('4b8ae564-f8e6-474a-8ef0-b6bf4b6b7525','26e9b717-671d-4b6c-b548-13b1145dbb82','t-1','EXPECTED','IN_TRANSIT_TO_TERMINAL',1,0,0,0,1,1,0),('54d9d7c4-7a79-4404-82ea-45109ad36a05','26e9b717-671d-4b6c-b548-13b1145dbb82','t-7','EXAMINATION_SCHEDULED','UNDER_EXAMINATION',1,1,0,0,1,1,6),('5a09c734-2adf-462f-a504-af3d1c0eed0e','4c72c051-2d7d-44fa-a85c-be6a57d3c039','t-1','EXPECTED','IN_TRANSIT_TO_TERMINAL',0,0,0,0,1,1,0),('5e0781de-5104-4b5d-beb3-75660124a0f1','4c72c051-2d7d-44fa-a85c-be6a57d3c039','t-6','DOCS_IN_PROGRESS','EXAMINATION_SCHEDULED',1,1,0,0,1,1,5),('5fca6ef6-247e-4014-b849-c630d36ef1d0','69ef53ae-6187-4ac2-9bfa-4210190ae49d','t-6','DOCS_IN_PROGRESS','EXAMINATION_SCHEDULED',1,1,0,0,1,1,6),('60caf9e5-3ec9-4365-b632-988ed85d1072','69ef53ae-6187-4ac2-9bfa-4210190ae49d','t-8','UNDER_EXAMINATION','EXAMINATION_COMPLETE',1,1,0,0,1,1,8),('6cecff33-aff9-4f9e-8c41-c1ce10000f50','96dd9a2d-656d-47e3-a403-203addf7c549','t-9','EXAMINATION_COMPLETE','CHARGES_PENDING',1,1,0,0,1,1,8),('7140e831-6da1-4d07-8fc7-1e6f64a34aef','69ef53ae-6187-4ac2-9bfa-4210190ae49d','t-12','RELEASE_AUTHORISED','SLOT_BOOKED',1,1,1,1,1,1,12),('74c78e69-6439-4fe7-a386-efd525006beb','69ef53ae-6187-4ac2-9bfa-4210190ae49d','t-4','RECEIVED','STORED',0,0,0,0,1,1,4),('79daa7a5-8d84-4986-a0ef-743a4ef66e75','4c72c051-2d7d-44fa-a85c-be6a57d3c039','t-11','CHARGES_SETTLED','RELEASE_AUTHORISED',1,1,1,1,1,1,10),('7d633596-3053-4ea2-8ba8-c6b5df41f69e','69ef53ae-6187-4ac2-9bfa-4210190ae49d','t-3','ARRIVED_AT_GATE','RECEIVED',0,0,0,0,1,1,3),('7f404a85-de16-409e-aa0e-436ea8ae622d','26e9b717-671d-4b6c-b548-13b1145dbb82','t-5','STORED','DOCS_IN_PROGRESS',0,1,0,0,1,1,4),('80a45562-27f9-46f4-b13c-97c8976a2a8d','69ef53ae-6187-4ac2-9bfa-4210190ae49d','t-15','GATE_OUT','CLOSED',0,0,0,0,0,1,15),('80c830f8-40ee-46df-91b8-a15f4bd29323','4c72c051-2d7d-44fa-a85c-be6a57d3c039','t-4','RECEIVED','STORED',0,0,0,0,1,1,3),('8c2e39c9-a464-40bb-bcdf-febdea9d83dc','96dd9a2d-656d-47e3-a403-203addf7c549','t-15','GATE_OUT','CLOSED',0,0,0,0,0,1,14),('960114b3-b1f0-4ae0-b65d-6200bfdebe18','4c72c051-2d7d-44fa-a85c-be6a57d3c039','t-15','GATE_OUT','CLOSED',0,0,0,0,0,1,14),('97e26a88-6e30-4ca5-9131-0e17c7983ff9','96dd9a2d-656d-47e3-a403-203addf7c549','t-3','ARRIVED_AT_GATE','RECEIVED',0,0,0,0,1,1,2),('9f7e949d-7b41-4242-8235-44526c8d6ad7','26e9b717-671d-4b6c-b548-13b1145dbb82','t-13','SLOT_BOOKED','LOADING',1,1,1,1,0,1,12),('a057e51a-c362-4d8d-b0e7-5a631558fe94','26e9b717-671d-4b6c-b548-13b1145dbb82','t-2','IN_TRANSIT_TO_TERMINAL','ARRIVED_AT_GATE',0,0,0,0,1,1,1),('a0836a3f-ae9c-4639-942d-a2157ef50f24','69ef53ae-6187-4ac2-9bfa-4210190ae49d','t-1','EXPECTED','IN_TRANSIT_TO_TERMINAL',0,0,0,0,1,1,1),('a1e487cd-9d62-4da3-9521-7844464e4915','96dd9a2d-656d-47e3-a403-203addf7c549','t-2','IN_TRANSIT_TO_TERMINAL','ARRIVED_AT_GATE',0,0,0,0,1,1,1),('a2f29837-8bb9-4765-beec-294e6b076c18','4c72c051-2d7d-44fa-a85c-be6a57d3c039','t-7','EXAMINATION_SCHEDULED','UNDER_EXAMINATION',1,1,0,0,1,1,6),('a3ea29c0-0273-41ea-976a-7d62abf360ee','26e9b717-671d-4b6c-b548-13b1145dbb82','t-4','RECEIVED','STORED',0,0,0,0,1,1,3),('a4a57f11-3337-4ffb-9833-1588abfe93a1','69ef53ae-6187-4ac2-9bfa-4210190ae49d','t-10','CHARGES_PENDING','CHARGES_SETTLED',1,1,0,0,1,1,10),('a71604b3-3540-40f6-a4b8-e82b46ec2138','26e9b717-671d-4b6c-b548-13b1145dbb82','t-10','CHARGES_PENDING','CHARGES_SETTLED',1,1,0,0,1,1,9),('aa7c6ded-a096-4f67-a549-cc0238292db0','26e9b717-671d-4b6c-b548-13b1145dbb82','t-8','UNDER_EXAMINATION','EXAMINATION_COMPLETE',1,1,0,0,1,1,7),('ae137e21-1b83-4ab4-8e4f-5b53d733e32d','69ef53ae-6187-4ac2-9bfa-4210190ae49d','t-11','CHARGES_SETTLED','RELEASE_AUTHORISED',1,1,1,1,1,1,11),('b785a8b8-9088-462e-b1a6-83652eef18bf','26e9b717-671d-4b6c-b548-13b1145dbb82','t-12','RELEASE_AUTHORISED','SLOT_BOOKED',1,1,1,1,1,1,11),('be369739-a930-47bd-981f-710460f3af2f','96dd9a2d-656d-47e3-a403-203addf7c549','t-7','EXAMINATION_SCHEDULED','UNDER_EXAMINATION',1,1,0,0,1,1,6),('bfabec33-8c4a-426f-8450-beb4bb15aca0','26e9b717-671d-4b6c-b548-13b1145dbb82','t-11','CHARGES_SETTLED','RELEASE_AUTHORISED',1,1,1,1,1,1,10),('cd630829-6aac-4808-8e24-de2bd5aa16dd','96dd9a2d-656d-47e3-a403-203addf7c549','t-5','STORED','DOCS_IN_PROGRESS',0,1,0,0,1,1,4),('d3b5e884-797f-446a-a3d7-0a7812392f10','96dd9a2d-656d-47e3-a403-203addf7c549','t-13','SLOT_BOOKED','LOADING',1,1,1,1,0,1,12),('dbe7027c-0ea3-484e-a9a4-d2f58ccb48a8','4c72c051-2d7d-44fa-a85c-be6a57d3c039','t-3','ARRIVED_AT_GATE','RECEIVED',0,0,0,0,1,1,2),('df80d0fc-f078-414d-b808-a70f10eeedf4','4c72c051-2d7d-44fa-a85c-be6a57d3c039','t-2','IN_TRANSIT_TO_TERMINAL','ARRIVED_AT_GATE',0,0,0,0,1,1,1),('e53bc9d0-7c13-45df-ba7e-1de1e594ba91','96dd9a2d-656d-47e3-a403-203addf7c549','t-8','UNDER_EXAMINATION','EXAMINATION_COMPLETE',1,1,0,0,1,1,7),('f1483b44-ef6b-4a00-899a-f0c646d75ce4','4c72c051-2d7d-44fa-a85c-be6a57d3c039','t-13','SLOT_BOOKED','LOADING',1,1,1,1,0,1,12),('f5ba1997-b057-4256-bee8-b1690918ec40','4c72c051-2d7d-44fa-a85c-be6a57d3c039','t-14','LOADING','GATE_OUT',1,1,1,1,1,1,13),('fcbe7620-4171-4bd0-bc65-ec26ba540393','69ef53ae-6187-4ac2-9bfa-4210190ae49d','t-7','EXAMINATION_SCHEDULED','UNDER_EXAMINATION',1,1,0,0,1,1,7),('febfd356-3ce5-4f7a-afa5-8745a364cb56','4c72c051-2d7d-44fa-a85c-be6a57d3c039','t-5','STORED','DOCS_IN_PROGRESS',0,1,0,0,1,1,4);
/*!40000 ALTER TABLE `cargo_transitions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_config_audit`
--

DROP TABLE IF EXISTS `document_config_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_config_audit` (
  `id` char(36) NOT NULL,
  `config_version_id` char(36) NOT NULL,
  `actor_id` char(36) NOT NULL,
  `action` varchar(80) NOT NULL,
  `change_reason` varchar(500) NOT NULL,
  `before_json` longtext DEFAULT NULL,
  `after_json` longtext NOT NULL,
  `request_id` char(36) NOT NULL,
  `ip_address` varchar(45) NOT NULL DEFAULT '',
  `user_agent` varchar(500) NOT NULL DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `details` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_config_audit_request` (`request_id`),
  KEY `idx_document_config_audit_version` (`config_version_id`),
  KEY `idx_document_config_audit_actor` (`actor_id`),
  KEY `idx_document_config_audit_created` (`created_at`),
  CONSTRAINT `fk_document_config_audit_version` FOREIGN KEY (`config_version_id`) REFERENCES `document_config_versions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_config_audit`
--

LOCK TABLES `document_config_audit` WRITE;
/*!40000 ALTER TABLE `document_config_audit` DISABLE KEYS */;
INSERT INTO `document_config_audit` VALUES ('02e94b56-7c3e-4c61-9239-f6ba85519eec','26c22d35-73b4-4696-a76b-d40a8525250d','c0654f0b-8452-4a03-a43d-0d0cda17da1b','DOCUMENT_CONFIGURATION_UPDATED','Document configuration updated','{\"numbering_prefix\":\"TRN\",\"numbering_format\":\"TRN-{TYPE}-{YYYY}-{SEQ:6}\",\"retention_months\":84,\"document_types\":[{\"key\":\"receipt_note\",\"label\":\"Receipt Note\",\"required\":1,\"has_expiry\":0,\"verification_required\":1},{\"key\":\"release_authorisation\",\"label\":\"Release Authorisation\",\"required\":1,\"has_expiry\":0,\"verification_required\":1},{\"key\":\"gate_pass\",\"label\":\"Gate Pass\",\"required\":1,\"has_expiry\":1,\"verification_required\":1},{\"key\":\"storage_statement\",\"label\":\"Storage Statement\",\"required\":0,\"has_expiry\":0,\"verification_required\":1},{\"key\":\"examination_report\",\"label\":\"Examination Attendance Report\",\"required\":0,\"has_expiry\":0,\"verification_required\":1},{\"key\":\"delivery_order\",\"label\":\"Delivery Order\",\"required\":1,\"has_expiry\":1,\"verification_required\":1}],\"templates\":[]}','{\"numbering_prefix\":\"TRN\",\"numbering_format\":\"TRN-{TYPE}-{YYYY}-{SEQ:6}\",\"retention_months\":84,\"document_types\":[{\"id\":\"efed375a-f850-4312-800b-14a60c7918f1\",\"key\":\"receipt_note\",\"label\":\"Receipt Note\",\"required\":true,\"has_expiry\":true,\"verification_required\":true,\"sort_order\":0},{\"id\":\"d384b999-ed83-4266-bf24-7fdeab4096ba\",\"key\":\"release_authorisation\",\"label\":\"Release Authorisation\",\"required\":true,\"has_expiry\":true,\"verification_required\":true,\"sort_order\":1},{\"id\":\"a33ffb0d-2322-461c-9a4d-e73b0eaa0b62\",\"key\":\"gate_pass\",\"label\":\"Gate Pass\",\"required\":true,\"has_expiry\":true,\"verification_required\":true,\"sort_order\":2},{\"id\":\"a204778c-6807-424d-9747-6ef4a456ccca\",\"key\":\"storage_statement\",\"label\":\"Storage Statement\",\"required\":true,\"has_expiry\":true,\"verification_required\":true,\"sort_order\":3},{\"id\":\"d8fad965-3ae3-4041-9009-7108f19c450f\",\"key\":\"examination_report\",\"label\":\"Examination Attendance Report\",\"required\":true,\"has_expiry\":true,\"verification_required\":true,\"sort_order\":4},{\"id\":\"b3b36d8f-df25-4c51-bf2c-662ef8c8d996\",\"key\":\"delivery_order\",\"label\":\"Delivery Order\",\"required\":true,\"has_expiry\":true,\"verification_required\":true,\"sort_order\":5}],\"templates\":[{\"id\":\"bb222777-f7a0-4c5e-a0fc-7c149e31b852\",\"key\":\"gate_pass\",\"label\":\"Gate Pass\",\"version\":1,\"active\":true,\"sort_order\":0}]}','d68d9b26-256a-4eae-8b29-ad97e6e848ca','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-09 19:19:23',NULL),('2ee03de9-ec5f-4ed4-88f8-a34c10078e42','91e733b8-de81-431b-a803-509e2dba2dcf','c0654f0b-8452-4a03-a43d-0d0cda17da1b','DOCUMENT_CONFIGURATION_UPDATED','Document configuration updated','{\"numbering_prefix\":\"TRN\",\"numbering_format\":\"TRN-{TYPE}-{YYYY}-{SEQ:6}\",\"retention_months\":84,\"document_types\":[{\"key\":\"receipt_note\",\"label\":\"Receipt Note\",\"required\":1,\"has_expiry\":1,\"verification_required\":1},{\"key\":\"release_authorisation\",\"label\":\"Release Authorisation\",\"required\":1,\"has_expiry\":1,\"verification_required\":1},{\"key\":\"gate_pass\",\"label\":\"Gate Pass\",\"required\":1,\"has_expiry\":1,\"verification_required\":1},{\"key\":\"storage_statement\",\"label\":\"Storage Statement\",\"required\":1,\"has_expiry\":1,\"verification_required\":1},{\"key\":\"examination_report\",\"label\":\"Examination Attendance Report\",\"required\":1,\"has_expiry\":1,\"verification_required\":1},{\"key\":\"delivery_order\",\"label\":\"Delivery Order\",\"required\":1,\"has_expiry\":1,\"verification_required\":1}],\"templates\":[{\"key\":\"receipt_note\",\"label\":\"Gate Pass\",\"version\":2,\"active\":1}]}','{\"numbering_prefix\":\"TRN\",\"numbering_format\":\"TRN-{TYPE}-{YYYY}-{SEQ:6}\",\"retention_months\":84,\"document_types\":[{\"id\":\"0fa1f5dc-7a85-46c9-a16d-8e4f96df48cc\",\"key\":\"receipt_note\",\"label\":\"Receipt Note\",\"required\":true,\"has_expiry\":true,\"verification_required\":true,\"sort_order\":0},{\"id\":\"8547fed4-2988-4f61-beb3-ab9b31fd27b6\",\"key\":\"release_authorisation\",\"label\":\"Release Authorisation\",\"required\":true,\"has_expiry\":true,\"verification_required\":true,\"sort_order\":1},{\"id\":\"1ce77f2f-9f3a-4ca0-9294-d82090c03332\",\"key\":\"gate_pass\",\"label\":\"Gate Pass\",\"required\":true,\"has_expiry\":true,\"verification_required\":true,\"sort_order\":2},{\"id\":\"794f28b5-4aab-4c5d-9654-4ef58613d09a\",\"key\":\"storage_statement\",\"label\":\"Storage Statement\",\"required\":true,\"has_expiry\":true,\"verification_required\":true,\"sort_order\":3},{\"id\":\"ca6131ad-4782-4ced-a3de-2249753a5617\",\"key\":\"examination_report\",\"label\":\"Examination Attendance Report\",\"required\":true,\"has_expiry\":true,\"verification_required\":true,\"sort_order\":4},{\"id\":\"d8e4a229-d77f-4a34-9446-80b1a130f1e6\",\"key\":\"delivery_order\",\"label\":\"Delivery Order\",\"required\":true,\"has_expiry\":true,\"verification_required\":true,\"sort_order\":5}],\"templates\":[{\"id\":\"4cfaefc9-317b-44da-baa7-93ee5f357d3f\",\"key\":\"gate_pass\",\"label\":\"Gate Pass\",\"version\":2,\"active\":true,\"sort_order\":0},{\"id\":\"fcd78393-4b8c-4e41-8812-7f0ef9fe7546\",\"key\":\"receipt_note\",\"label\":\"Set fd\",\"version\":1,\"active\":true,\"sort_order\":1}]}','daec0091-0394-446b-b778-80793d798c85','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-09 19:32:24',NULL),('5110506a-b99d-44c0-a7a8-03cf1b28135c','2d0cdcf8-4d78-4a6a-89c9-b49d6f517bb4','c0654f0b-8452-4a03-a43d-0d0cda17da1b','documents_configuration_updated','',NULL,'','','','','2026-10-09 19:41:33','{\"numbering_prefix\":\"TRN\",\"numbering_format\":\"TRN-{TYPE}-{YYYY}-{SEQ:6}\",\"retention_months\":84,\"document_type_count\":6}'),('b2275a9c-6d14-4268-93f4-c0d101a7077d','2d0cdcf8-4d78-4a6a-89c9-b49d6f517bb4','c0654f0b-8452-4a03-a43d-0d0cda17da1b','updated','',NULL,'','0b3185be-0b8c-4410-934e-00a791b2a512','','','2026-10-09 19:54:27','{\"numbering_prefix\":\"TRN\",\"numbering_format\":\"TRN-{TYPE}-{YYYY}-{SEQ:6}\",\"retention_months\":84,\"document_type_count\":6}'),('c8eeade3-37f6-4094-86f5-07df7101dd27','2d0cdcf8-4d78-4a6a-89c9-b49d6f517bb4','c0654f0b-8452-4a03-a43d-0d0cda17da1b','updated','',NULL,'','83532dca-c119-4ac8-8762-b7680b77a3c1','','','2026-10-09 19:55:05','{\"numbering_prefix\":\"TRN\",\"numbering_format\":\"TRN-{TYPE}-{YYYY}-{SEQ:6}\",\"retention_months\":84,\"document_type_count\":6}'),('cf2a7b8d-23b8-4090-bd12-e27ee445cff6','2d0cdcf8-4d78-4a6a-89c9-b49d6f517bb4','c0654f0b-8452-4a03-a43d-0d0cda17da1b','updated','',NULL,'','2d742ae1-175d-44d1-8da0-802b6c8e4f6a','','','2026-10-09 19:54:57','{\"numbering_prefix\":\"TRN\",\"numbering_format\":\"TRN-{TYPE}-{YYYY}-{SEQ:6}\",\"retention_months\":84,\"document_type_count\":7}');
/*!40000 ALTER TABLE `document_config_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_config_versions`
--

DROP TABLE IF EXISTS `document_config_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_config_versions` (
  `id` char(36) NOT NULL,
  `version_no` int(10) unsigned NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `numbering_prefix` varchar(20) NOT NULL,
  `numbering_format` varchar(150) NOT NULL,
  `retention_months` smallint(5) unsigned NOT NULL,
  `change_reason` varchar(500) NOT NULL,
  `created_by` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_config_version_no` (`version_no`),
  KEY `idx_document_config_current` (`is_current`),
  CONSTRAINT `chk_document_retention_months` CHECK (`retention_months` between 1 and 1200)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_config_versions`
--

LOCK TABLES `document_config_versions` WRITE;
/*!40000 ALTER TABLE `document_config_versions` DISABLE KEYS */;
INSERT INTO `document_config_versions` VALUES ('26c22d35-73b4-4696-a76b-d40a8525250d',2,0,'TRN','TRN-{TYPE}-{YYYY}-{SEQ:6}',84,'Document configuration updated','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 19:19:23'),('2d0cdcf8-4d78-4a6a-89c9-b49d6f517bb4',4,1,'TRN','TRN-{TYPE}-{YYYY}-{SEQ:6}',84,'Documents configuration updated','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 19:41:33'),('91e733b8-de81-431b-a803-509e2dba2dcf',3,0,'TRN','TRN-{TYPE}-{YYYY}-{SEQ:6}',84,'Document configuration updated','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 19:32:24'),('e227fbb6-1af1-443b-a823-97b7e324f218',1,0,'TRN','TRN-{TYPE}-{YYYY}-{SEQ:6}',84,'Initial document configuration','00000000-0000-4000-8000-000000000000','2026-10-09 19:16:32');
/*!40000 ALTER TABLE `document_config_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `document_types` (
  `id` char(36) NOT NULL,
  `config_version_id` char(36) NOT NULL,
  `document_key` varchar(80) NOT NULL,
  `label` varchar(150) NOT NULL,
  `required` tinyint(1) NOT NULL DEFAULT 0,
  `has_expiry` tinyint(1) NOT NULL DEFAULT 0,
  `verification_required` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_document_type_version_key` (`config_version_id`,`document_key`),
  KEY `idx_document_types_version_order` (`config_version_id`,`sort_order`),
  CONSTRAINT `fk_document_types_config_version` FOREIGN KEY (`config_version_id`) REFERENCES `document_config_versions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
--

LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
INSERT INTO `document_types` VALUES ('0fa1f5dc-7a85-46c9-a16d-8e4f96df48cc','26c22d35-73b4-4696-a76b-d40a8525250d','receipt_note','Receipt Note',1,1,1,0,'2026-10-09 19:19:23'),('1b6b9cff-d28f-42d3-8442-3970056d5dfc','91e733b8-de81-431b-a803-509e2dba2dcf','storage_statement','Storage Statement',1,1,1,3,'2026-10-09 19:32:24'),('1ce77f2f-9f3a-4ca0-9294-d82090c03332','26c22d35-73b4-4696-a76b-d40a8525250d','gate_pass','Gate Pass',1,1,1,2,'2026-10-09 19:19:23'),('3593b0fc-d7a0-4d4f-b255-404e662e534a','91e733b8-de81-431b-a803-509e2dba2dcf','receipt_note','Receipt Note',1,1,1,0,'2026-10-09 19:32:24'),('3b0bedc7-1d79-4059-ac78-0b3019d3107d','2d0cdcf8-4d78-4a6a-89c9-b49d6f517bb4','receipt_note','Receipt Note',1,1,0,0,'2026-10-09 19:55:05'),('47852828-75f6-4631-99b6-a0237777075e','2d0cdcf8-4d78-4a6a-89c9-b49d6f517bb4','release_authorisation','Release Authorisation',1,1,1,1,'2026-10-09 19:55:05'),('6b1e4441-a4b3-436f-93b3-d2c6aabc7b9a','91e733b8-de81-431b-a803-509e2dba2dcf','gate_pass','Gate Pass',1,1,1,2,'2026-10-09 19:32:24'),('794f28b5-4aab-4c5d-9654-4ef58613d09a','26c22d35-73b4-4696-a76b-d40a8525250d','storage_statement','Storage Statement',1,1,1,3,'2026-10-09 19:19:23'),('7956ed40-e233-4475-adfa-eeb4b33adf4a','2d0cdcf8-4d78-4a6a-89c9-b49d6f517bb4','delivery_order','Delivery Order',1,1,1,5,'2026-10-09 19:55:05'),('8547fed4-2988-4f61-beb3-ab9b31fd27b6','26c22d35-73b4-4696-a76b-d40a8525250d','release_authorisation','Release Authorisation',1,1,1,1,'2026-10-09 19:19:23'),('a204778c-6807-424d-9747-6ef4a456ccca','e227fbb6-1af1-443b-a823-97b7e324f218','storage_statement','Storage Statement',0,0,1,4,'2026-10-09 19:16:32'),('a33ffb0d-2322-461c-9a4d-e73b0eaa0b62','e227fbb6-1af1-443b-a823-97b7e324f218','gate_pass','Gate Pass',1,1,1,3,'2026-10-09 19:16:32'),('b1cb5ba0-0748-48da-a282-51305ad5d1ab','2d0cdcf8-4d78-4a6a-89c9-b49d6f517bb4','examination_report','Examination Attendance Report',1,1,1,4,'2026-10-09 19:55:05'),('b3b36d8f-df25-4c51-bf2c-662ef8c8d996','e227fbb6-1af1-443b-a823-97b7e324f218','delivery_order','Delivery Order',1,1,1,6,'2026-10-09 19:16:32'),('c357f93f-c130-4552-a149-e512ec6f90d1','91e733b8-de81-431b-a803-509e2dba2dcf','release_authorisation','Release Authorisation',1,1,1,1,'2026-10-09 19:32:24'),('ca6131ad-4782-4ced-a3de-2249753a5617','26c22d35-73b4-4696-a76b-d40a8525250d','examination_report','Examination Attendance Report',1,1,1,4,'2026-10-09 19:19:23'),('d384b999-ed83-4266-bf24-7fdeab4096ba','e227fbb6-1af1-443b-a823-97b7e324f218','release_authorisation','Release Authorisation',1,0,1,2,'2026-10-09 19:16:32'),('d75507f9-a1e1-4cdf-823f-7237de0f6448','2d0cdcf8-4d78-4a6a-89c9-b49d6f517bb4','gate_pass','Gate Pass',1,1,1,2,'2026-10-09 19:55:05'),('d8e4a229-d77f-4a34-9446-80b1a130f1e6','26c22d35-73b4-4696-a76b-d40a8525250d','delivery_order','Delivery Order',1,1,1,5,'2026-10-09 19:19:23'),('d8fad965-3ae3-4041-9009-7108f19c450f','e227fbb6-1af1-443b-a823-97b7e324f218','examination_report','Examination Attendance Report',0,0,1,5,'2026-10-09 19:16:32'),('efed375a-f850-4312-800b-14a60c7918f1','e227fbb6-1af1-443b-a823-97b7e324f218','receipt_note','Receipt Note',1,0,1,1,'2026-10-09 19:16:32'),('f116c41d-67e7-4dc5-add7-4d93f348f8df','2d0cdcf8-4d78-4a6a-89c9-b49d6f517bb4','storage_statement','Storage Statement',1,0,1,3,'2026-10-09 19:55:05'),('fe4d332b-3f77-438d-8fdf-fcd0c6d25264','91e733b8-de81-431b-a803-509e2dba2dcf','examination_report','Examination Attendance Report',1,1,1,4,'2026-10-09 19:32:24'),('fff19339-7276-4522-a27c-7a23a7d8c470','91e733b8-de81-431b-a803-509e2dba2dcf','delivery_order','Delivery Order',1,1,1,5,'2026-10-09 19:32:24');
/*!40000 ALTER TABLE `document_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feature_flag_audit_logs`
--

DROP TABLE IF EXISTS `feature_flag_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feature_flag_audit_logs` (
  `id` char(36) NOT NULL,
  `actor_id` char(36) NOT NULL,
  `action` varchar(100) NOT NULL,
  `change_reason` varchar(500) NOT NULL DEFAULT '',
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`details`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_feature_flag_audit_actor` (`actor_id`),
  KEY `idx_feature_flag_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feature_flag_audit_logs`
--

LOCK TABLES `feature_flag_audit_logs` WRITE;
/*!40000 ALTER TABLE `feature_flag_audit_logs` DISABLE KEYS */;
INSERT INTO `feature_flag_audit_logs` VALUES ('275d68ae-2f25-4145-a649-181a0ba8973d','c0654f0b-8452-4a03-a43d-0d0cda17da1b','feature_flag_configuration_initialized','Initial feature flag configuration','{\"configuration_id\":\"e3a7ea2f-25a7-4de6-bdc8-04e72c07a8f3\",\"audit_all_changes\":true,\"require_reason\":true,\"flags_initialized\":0}','2026-10-09 21:33:55'),('b23e04ef-5297-4a07-889b-98a4c3d4e059','c0654f0b-8452-4a03-a43d-0d0cda17da1b','feature_flags_initialized','Initial feature flag catalogue','{\"configuration_id\":\"e3a7ea2f-25a7-4de6-bdc8-04e72c07a8f3\",\"inserted_count\":14,\"existing_count\":0,\"inserted_flags\":[\"public.cargo_tracking\",\"public.metrics_display\",\"public.terminal_map\",\"portal.self_registration\",\"portal.quote_request\",\"portal.online_payment\",\"portal.storage_accrual\",\"ops.offline_gate\",\"ops.anpr\",\"ops.handheld_scanner\",\"ops.automated_yard\",\"platform.native_mobile\",\"platform.developer_api\",\"platform.trade_finance\"]}','2026-10-09 21:38:04'),('bb5286ba-3c5f-4988-99db-07d940680cf9','c0654f0b-8452-4a03-a43d-0d0cda17da1b','feature_flags_updated','sdsdvsd','{\"config_changes\":[],\"flag_changes\":[{\"id\":\"54719215-8156-4d64-9710-da337c70379e\",\"key\":\"ops.anpr\",\"label\":\"ANPR plate recognition\",\"old_enabled\":false,\"new_enabled\":true}]}','2026-10-09 21:40:51');
/*!40000 ALTER TABLE `feature_flag_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feature_flag_config`
--

DROP TABLE IF EXISTS `feature_flag_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feature_flag_config` (
  `id` char(36) NOT NULL,
  `audit_all_changes` tinyint(1) NOT NULL DEFAULT 1,
  `require_reason` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` char(36) NOT NULL,
  `updated_by` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `allow_per_org_override` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feature_flag_config`
--

LOCK TABLES `feature_flag_config` WRITE;
/*!40000 ALTER TABLE `feature_flag_config` DISABLE KEYS */;
INSERT INTO `feature_flag_config` VALUES ('e3a7ea2f-25a7-4de6-bdc8-04e72c07a8f3',1,1,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:33:55','2026-10-09 21:33:55',0);
/*!40000 ALTER TABLE `feature_flag_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feature_flags`
--

DROP TABLE IF EXISTS `feature_flags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `feature_flags` (
  `id` char(36) NOT NULL,
  `flag_key` varchar(150) NOT NULL,
  `label` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `scope` enum('public','portal','operations','platform') NOT NULL DEFAULT 'platform',
  `enabled` tinyint(1) NOT NULL DEFAULT 0,
  `requires_approval` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` char(36) NOT NULL,
  `updated_by` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `flag_key` (`flag_key`),
  KEY `idx_feature_flags_scope` (`scope`),
  KEY `idx_feature_flags_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feature_flags`
--

LOCK TABLES `feature_flags` WRITE;
/*!40000 ALTER TABLE `feature_flags` DISABLE KEYS */;
INSERT INTO `feature_flags` VALUES ('15093fd3-a788-46b4-aaf2-0e3ab7085525','platform.developer_api','Developer public API','Deferred scope. Public developer programme; disabled by default.','platform',0,1,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:38:04','2026-10-09 21:38:04'),('2ce122b1-0467-43c0-aee7-fce875b6df3c','portal.quote_request','Quote request submission','Allow unauth and auth users to submit quote requests.','portal',1,0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:38:04','2026-10-09 21:38:04'),('338cd542-bf12-4782-8d67-dabc5726bf1a','platform.native_mobile','Native mobile applications','Deferred scope. Reserved for Phase 3+; no effect while disabled.','platform',0,1,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:38:04','2026-10-09 21:38:04'),('360a854b-ccf3-411f-a509-5b69a55833ec','public.cargo_tracking','Public cargo tracking','Allow unauthenticated tracking lookups on the public site.','public',1,0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:38:04','2026-10-09 21:38:04'),('3c258780-11bd-4a7b-99b7-5f125504c93b','ops.automated_yard','Automated yard optimisation','Deferred scope. Reserved for future phases; disabled by default.','operations',0,1,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:38:04','2026-10-09 21:38:04'),('47eb8677-9c19-4843-beaa-4b9cb4c0f622','ops.offline_gate','Offline gate authorisation','Allow gate decisions from cached authorisations when upstream is unavailable.','operations',1,1,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:38:04','2026-10-09 21:38:04'),('54719215-8156-4d64-9710-da337c70379e','ops.anpr','ANPR plate recognition','Enable automatic plate match to booking at gate. Manual fallback always available.','operations',1,0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:38:04','2026-10-09 21:40:51'),('5564893e-055b-462a-9cb3-df06ffae1dd6','portal.online_payment','Online payment initiation','Allow customers to initiate payment from the portal.','portal',1,1,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:38:04','2026-10-09 21:38:04'),('7d3558bc-8df3-4d47-97bc-315dc36060bd','portal.storage_accrual','Live storage accrual','Show real-time storage cost accrual in the portal.','portal',1,0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:38:04','2026-10-09 21:38:04'),('7e2aea3a-fa80-444c-9768-99af7ca5a9bd','platform.trade_finance','Trade finance marketplace','Deferred scope. Reserved for future phases; disabled by default.','platform',0,1,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:38:04','2026-10-09 21:38:04'),('a6c35761-ef82-4614-9816-4a1610553c1e','public.terminal_map','Interactive terminal map','Enable the public zone visualisation.','public',0,0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:38:04','2026-10-09 21:38:04'),('ca1529f6-c941-4a3c-976e-d4db780bec90','public.metrics_display','Public metrics display','Show aggregate operational metrics on the public site. Suppressible without deploy.','public',1,1,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:38:04','2026-10-09 21:38:04'),('ce62e72e-2a94-4520-8425-f6677afbbb94','ops.handheld_scanner','Handheld scanning','Enable barcode/QR scanning on staff handhelds.','operations',1,0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:38:04','2026-10-09 21:38:04'),('eed191ee-7817-4710-b362-6ec710833a6d','portal.self_registration','Portal self-registration','Allow prospects to create an account pending approval.','portal',1,0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:38:04','2026-10-09 21:38:04');
/*!40000 ALTER TABLE `feature_flags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `financial_configuration`
--

DROP TABLE IF EXISTS `financial_configuration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `financial_configuration` (
  `id` varchar(100) NOT NULL,
  `config_key` varchar(100) NOT NULL,
  `base_currency` varchar(3) NOT NULL DEFAULT 'NGN',
  `vat_rate` decimal(5,2) NOT NULL DEFAULT 7.50,
  `discount_threshold` decimal(18,2) NOT NULL DEFAULT 500000.00,
  `waiver_threshold` decimal(18,2) NOT NULL DEFAULT 250000.00,
  `credit_note_threshold` decimal(18,2) NOT NULL DEFAULT 100000.00,
  `dual_approval_required` tinyint(1) NOT NULL DEFAULT 1,
  `clearance_gate_enforced` tinyint(1) NOT NULL DEFAULT 1,
  `allow_approved_credit` tinyint(1) NOT NULL DEFAULT 1,
  `allow_waiver` tinyint(1) NOT NULL DEFAULT 0,
  `auto_block_on_exposure` tinyint(1) NOT NULL DEFAULT 1,
  `default_credit_terms_days` int(11) NOT NULL DEFAULT 30,
  `dunning_interval_days` int(11) NOT NULL DEFAULT 7,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `financial_configuration`
--

LOCK TABLES `financial_configuration` WRITE;
/*!40000 ALTER TABLE `financial_configuration` DISABLE KEYS */;
INSERT INTO `financial_configuration` VALUES ('c2c1db49-fd87-4bc7-93b4-384936ca89df','default','NGN',7.50,500000.00,250000.00,100000.00,1,1,1,1,1,30,7,'2026-10-09 17:14:52','2026-10-09 17:14:52');
/*!40000 ALTER TABLE `financial_configuration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `financial_configuration_audit`
--

DROP TABLE IF EXISTS `financial_configuration_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `financial_configuration_audit` (
  `id` varchar(100) NOT NULL,
  `configuration_id` varchar(100) NOT NULL,
  `actor_id` varchar(100) DEFAULT NULL,
  `action` varchar(30) NOT NULL,
  `old_values` longtext DEFAULT NULL,
  `new_values` longtext NOT NULL,
  `change_reason` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_financial_audit_configuration` (`configuration_id`),
  KEY `idx_financial_audit_created_at` (`created_at`),
  CONSTRAINT `fk_financial_audit_configuration` FOREIGN KEY (`configuration_id`) REFERENCES `financial_configuration` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `financial_configuration_audit`
--

LOCK TABLES `financial_configuration_audit` WRITE;
/*!40000 ALTER TABLE `financial_configuration_audit` DISABLE KEYS */;
INSERT INTO `financial_configuration_audit` VALUES ('8a000f2d-dfcf-402e-8c3e-c7d81a954c4d','c2c1db49-fd87-4bc7-93b4-384936ca89df',NULL,'created',NULL,'{\"base_currency\":\"NGN\",\"vat_rate\":7.5,\"discount_threshold\":500000,\"waiver_threshold\":250000,\"credit_note_threshold\":100000,\"dual_approval_required\":true,\"clearance_gate_enforced\":true,\"allow_approved_credit\":true,\"allow_waiver\":true,\"auto_block_on_exposure\":true,\"default_credit_terms_days\":30,\"dunning_interval_days\":7}','fgfgh','2026-10-09 17:14:52');
/*!40000 ALTER TABLE `financial_configuration_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gate_blackout_periods`
--

DROP TABLE IF EXISTS `gate_blackout_periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gate_blackout_periods` (
  `id` char(36) NOT NULL,
  `gate_configuration_id` char(36) NOT NULL,
  `blackout_date` date NOT NULL,
  `reason` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gate_blackout_date` (`gate_configuration_id`,`blackout_date`),
  KEY `idx_gate_blackout_date` (`blackout_date`),
  CONSTRAINT `fk_gate_blackout_configuration` FOREIGN KEY (`gate_configuration_id`) REFERENCES `gate_configuration` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gate_blackout_periods`
--

LOCK TABLES `gate_blackout_periods` WRITE;
/*!40000 ALTER TABLE `gate_blackout_periods` DISABLE KEYS */;
INSERT INTO `gate_blackout_periods` VALUES ('7df6e6d7-a517-4d08-b2fa-6a1dda9f89db','ff8c4144-4ffe-49b1-9f26-dcf37ecf09c4','2026-12-25','Christmas Day','2026-10-09 16:55:08'),('bf794163-003d-41ee-8be6-9551410ca253','ff8c4144-4ffe-49b1-9f26-dcf37ecf09c4','2026-01-01','New Year\'s Day','2026-10-09 16:55:08');
/*!40000 ALTER TABLE `gate_blackout_periods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gate_configuration`
--

DROP TABLE IF EXISTS `gate_configuration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gate_configuration` (
  `id` char(36) NOT NULL,
  `config_key` varchar(40) NOT NULL DEFAULT 'default',
  `slot_duration` int(11) NOT NULL DEFAULT 60,
  `concurrent_slots` int(11) NOT NULL DEFAULT 3,
  `advance_booking_window_days` int(11) NOT NULL DEFAULT 7,
  `amendment_cutoff_hours` int(11) NOT NULL DEFAULT 4,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gate_configuration_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gate_configuration`
--

LOCK TABLES `gate_configuration` WRITE;
/*!40000 ALTER TABLE `gate_configuration` DISABLE KEYS */;
INSERT INTO `gate_configuration` VALUES ('ff8c4144-4ffe-49b1-9f26-dcf37ecf09c4','default',60,3,7,4,'2026-10-09 16:41:07','2026-10-09 16:41:07');
/*!40000 ALTER TABLE `gate_configuration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gate_configuration_audit`
--

DROP TABLE IF EXISTS `gate_configuration_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gate_configuration_audit` (
  `id` char(36) NOT NULL,
  `configuration_id` char(36) NOT NULL,
  `actor_id` varchar(128) NOT NULL,
  `action` varchar(40) NOT NULL,
  `old_values` longtext DEFAULT NULL,
  `new_values` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_gate_config_audit_configuration` (`configuration_id`),
  KEY `idx_gate_config_audit_actor` (`actor_id`),
  KEY `idx_gate_config_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gate_configuration_audit`
--

LOCK TABLES `gate_configuration_audit` WRITE;
/*!40000 ALTER TABLE `gate_configuration_audit` DISABLE KEYS */;
INSERT INTO `gate_configuration_audit` VALUES ('aa0cfb98-b521-476a-bb66-770309a41397','ff8c4144-4ffe-49b1-9f26-dcf37ecf09c4','c0654f0b-8452-4a03-a43d-0d0cda17da1b','UPDATE','{\"id\":\"ff8c4144-4ffe-49b1-9f26-dcf37ecf09c4\",\"slot_duration\":60,\"concurrent_slots\":3,\"advance_booking_window_days\":7,\"amendment_cutoff_hours\":4}','{\"slot_duration\":60,\"concurrent_slots\":3,\"advance_booking_window_days\":7,\"amendment_cutoff_hours\":4,\"blackout_periods\":[{\"id\":\"bf794163-003d-41ee-8be6-9551410ca253\",\"date\":\"2026-01-01\",\"reason\":\"New Year\'s Day\"},{\"id\":\"7df6e6d7-a517-4d08-b2fa-6a1dda9f89db\",\"date\":\"2026-12-25\",\"reason\":\"Christmas Day\"}],\"vehicle_requirements\":[{\"id\":\"e536d3b7-f18c-48ee-9ff3-dd44d05e1e0d\",\"label\":\"Valid terminal booking confirmation\"},{\"id\":\"dec8ad52-0694-4ed9-aa06-03e454097eca\",\"label\":\"Valid vehicle registration\"},{\"id\":\"3ab4970f-937e-485c-aa01-a106164c8720\",\"label\":\"Valid driver\'s licence\"},{\"id\":\"63cb0c23-e853-4a44-bf70-ec66ce5b3c19\",\"label\":\"Approved cargo documentation\"},{\"id\":\"b9ef4b23-bf59-4b29-9d06-0f677234dbc7\",\"label\":\"Valid vehicle insurance certificate\"}]}','2026-10-09 16:55:08');
/*!40000 ALTER TABLE `gate_configuration_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gate_vehicle_requirements`
--

DROP TABLE IF EXISTS `gate_vehicle_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gate_vehicle_requirements` (
  `id` char(36) NOT NULL,
  `gate_configuration_id` char(36) NOT NULL,
  `label` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_gate_vehicle_requirements_configuration` (`gate_configuration_id`),
  CONSTRAINT `fk_gate_vehicle_requirements_configuration` FOREIGN KEY (`gate_configuration_id`) REFERENCES `gate_configuration` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gate_vehicle_requirements`
--

LOCK TABLES `gate_vehicle_requirements` WRITE;
/*!40000 ALTER TABLE `gate_vehicle_requirements` DISABLE KEYS */;
INSERT INTO `gate_vehicle_requirements` VALUES ('3ab4970f-937e-485c-aa01-a106164c8720','ff8c4144-4ffe-49b1-9f26-dcf37ecf09c4','Valid driver\'s licence','2026-10-09 16:55:08'),('63cb0c23-e853-4a44-bf70-ec66ce5b3c19','ff8c4144-4ffe-49b1-9f26-dcf37ecf09c4','Approved cargo documentation','2026-10-09 16:55:08'),('b9ef4b23-bf59-4b29-9d06-0f677234dbc7','ff8c4144-4ffe-49b1-9f26-dcf37ecf09c4','Valid vehicle insurance certificate','2026-10-09 16:55:08'),('dec8ad52-0694-4ed9-aa06-03e454097eca','ff8c4144-4ffe-49b1-9f26-dcf37ecf09c4','Valid vehicle registration','2026-10-09 16:55:08'),('e536d3b7-f18c-48ee-9ff3-dd44d05e1e0d','ff8c4144-4ffe-49b1-9f26-dcf37ecf09c4','Valid terminal booking confirmation','2026-10-09 16:55:08');
/*!40000 ALTER TABLE `gate_vehicle_requirements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `integration_adapters`
--

DROP TABLE IF EXISTS `integration_adapters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `integration_adapters` (
  `id` char(36) NOT NULL,
  `adapter_key` varchar(100) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(100) NOT NULL,
  `icon` varchar(50) NOT NULL DEFAULT 'Webhook',
  `enabled` tinyint(1) NOT NULL DEFAULT 0,
  `environment` enum('sandbox','production') NOT NULL DEFAULT 'sandbox',
  `retry_count` tinyint(3) unsigned NOT NULL DEFAULT 3,
  `timeout_seconds` smallint(5) unsigned NOT NULL DEFAULT 30,
  `fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`fields`)),
  `created_by` char(36) DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `adapter_key` (`adapter_key`),
  KEY `idx_integration_adapters_category` (`category`),
  KEY `idx_integration_adapters_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `integration_adapters`
--

LOCK TABLES `integration_adapters` WRITE;
/*!40000 ALTER TABLE `integration_adapters` DISABLE KEYS */;
INSERT INTO `integration_adapters` VALUES ('06feff4e-88d9-48c4-adf6-7ed37c3dd26b','bank_reconciliation','Bank Reconciliation','Connect to a bank statement or reconciliation service.','Banking','Landmark',0,'sandbox',3,30,'[{\"key\":\"base_url\",\"label\":\"API base URL\",\"placeholder\":\"https:\\/\\/api.example.com\",\"kind\":\"url\",\"required\":true},{\"key\":\"client_id\",\"label\":\"Client ID\",\"placeholder\":\"Enter client ID\",\"kind\":\"text\",\"required\":true},{\"key\":\"client_secret\",\"label\":\"Client secret\",\"placeholder\":\"Enter client secret\",\"kind\":\"password\",\"required\":true,\"secret\":true}]',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:03:12','2026-10-09 21:20:38'),('45a45457-f0e1-4d95-9d89-8e5bf868078a','payment_gateway','Payment Gateway','Connect to an external payment provider.','Payments','CircleDollarSign',0,'sandbox',3,30,'[{\"key\":\"base_url\",\"label\":\"API base URL\",\"placeholder\":\"https:\\/\\/sandbox.example.com\",\"kind\":\"url\",\"required\":true},{\"key\":\"secret_key\",\"label\":\"Secret key\",\"placeholder\":\"Enter secret key\",\"kind\":\"password\",\"required\":true,\"secret\":true},{\"key\":\"webhook_secret\",\"label\":\"Webhook signing secret\",\"placeholder\":\"Enter webhook secret\",\"kind\":\"password\",\"required\":true,\"secret\":true}]',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:03:12','2026-10-09 21:20:38'),('6341215c-14c6-41ce-ab63-0e29e4942fda','webhook_service','External Webhooks','Manage outgoing webhook destinations and credentials.','Developer Tools','Webhook',0,'sandbox',3,30,'[{\"key\":\"endpoint_url\",\"label\":\"Endpoint URL\",\"placeholder\":\"https:\\/\\/your-service.example.com\\/webhook\",\"kind\":\"url\",\"required\":true},{\"key\":\"signing_secret\",\"label\":\"Signing secret\",\"placeholder\":\"Enter signing secret\",\"kind\":\"password\",\"required\":true,\"secret\":true}]',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:03:12','2026-10-09 21:20:38'),('93e61074-1d3b-499e-a1b6-2eff0eb21cd5','whatsapp_provider','WhatsApp Provider','Send approved WhatsApp notifications.','Communications','MessageSquare',0,'sandbox',3,30,'[{\"key\":\"base_url\",\"label\":\"API base URL\",\"placeholder\":\"https:\\/\\/api.example.com\",\"kind\":\"url\",\"required\":true},{\"key\":\"access_token\",\"label\":\"Access token\",\"placeholder\":\"Enter access token\",\"kind\":\"password\",\"required\":true,\"secret\":true}]',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:03:12','2026-10-09 21:20:38'),('9a2b7c27-7ff7-4c38-ad71-8b05b5e3ff7e','email_provider','Email Provider','Send platform notifications and transactional email.','Communications','Mail',0,'sandbox',3,30,'[{\"key\":\"api_key\",\"label\":\"API key\",\"placeholder\":\"Enter API key\",\"kind\":\"password\",\"required\":true,\"secret\":true},{\"key\":\"from_email\",\"label\":\"Sender email\",\"placeholder\":\"notifications@example.com\",\"kind\":\"email\",\"required\":true}]',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:03:12','2026-10-09 21:20:38'),('a4522764-c0fd-44c8-95d9-695d3429390a','customs_gateway','Customs Gateway','Connection to the customs or cargo clearance gateway.','Customs','ShieldCheck',0,'sandbox',3,30,'[{\"key\":\"base_url\",\"label\":\"API base URL\",\"placeholder\":\"https:\\/\\/sandbox.example.com\",\"kind\":\"url\",\"required\":true},{\"key\":\"api_key\",\"label\":\"API key\",\"placeholder\":\"Enter API key\",\"kind\":\"password\",\"required\":true,\"secret\":true}]',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:03:12','2026-10-09 21:20:38'),('bcd59698-0243-41aa-b105-cc499e0981d6','shipping_line','Shipping Line API','Connect to shipping line tracking and shipment services.','Shipping','Ship',0,'sandbox',3,30,'[{\"key\":\"base_url\",\"label\":\"API base URL\",\"placeholder\":\"https:\\/\\/api.example.com\",\"kind\":\"url\",\"required\":true},{\"key\":\"api_key\",\"label\":\"API key\",\"placeholder\":\"Enter API key\",\"kind\":\"password\",\"required\":true,\"secret\":true}]',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:03:12','2026-10-09 21:20:38'),('c91c23de-f379-47ce-a4f8-f7f21e7b17e8','sms_provider','SMS Provider','Send SMS alerts and verification messages.','Communications','Smartphone',0,'sandbox',3,30,'[{\"key\":\"base_url\",\"label\":\"API base URL\",\"placeholder\":\"https:\\/\\/api.example.com\",\"kind\":\"url\",\"required\":true},{\"key\":\"api_key\",\"label\":\"API key\",\"placeholder\":\"Enter API key\",\"kind\":\"password\",\"required\":true,\"secret\":true}]',NULL,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:03:12','2026-10-09 21:20:38');
/*!40000 ALTER TABLE `integration_adapters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `integration_audit_logs`
--

DROP TABLE IF EXISTS `integration_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `integration_audit_logs` (
  `id` char(36) NOT NULL,
  `actor_id` char(36) NOT NULL,
  `action` varchar(50) NOT NULL,
  `integration_id` char(36) DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_integration_audit_adapter` (`integration_id`),
  KEY `idx_integration_audit_created_at` (`created_at`),
  KEY `idx_integration_audit_actor` (`actor_id`),
  KEY `idx_integration_audit_action` (`action`),
  CONSTRAINT `fk_integration_audit_adapter` FOREIGN KEY (`integration_id`) REFERENCES `integration_adapters` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `integration_audit_logs`
--

LOCK TABLES `integration_audit_logs` WRITE;
/*!40000 ALTER TABLE `integration_audit_logs` DISABLE KEYS */;
INSERT INTO `integration_audit_logs` VALUES ('0a085ee0-2a66-41b2-b620-31db823765ac','c0654f0b-8452-4a03-a43d-0d0cda17da1b','integration_updated','a4522764-c0fd-44c8-95d9-695d3429390a','{\"enabled\":0,\"environment\":\"sandbox\",\"retry_count\":3,\"timeout_seconds\":30}','2026-10-09 21:20:38'),('1d410d14-732e-419c-a2ad-1b06601fb57b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','integration_updated','bcd59698-0243-41aa-b105-cc499e0981d6','{\"enabled\":0,\"environment\":\"sandbox\",\"retry_count\":3,\"timeout_seconds\":30}','2026-10-09 21:20:38'),('655681ce-b730-40d7-a2a6-879acda4136d','c0654f0b-8452-4a03-a43d-0d0cda17da1b','integration_updated','c91c23de-f379-47ce-a4f8-f7f21e7b17e8','{\"enabled\":0,\"environment\":\"sandbox\",\"retry_count\":3,\"timeout_seconds\":30}','2026-10-09 21:20:38'),('6b1edab1-ada9-4ed0-ad57-f41541cc4f8e','c0654f0b-8452-4a03-a43d-0d0cda17da1b','integration_updated','45a45457-f0e1-4d95-9d89-8e5bf868078a','{\"enabled\":0,\"environment\":\"sandbox\",\"retry_count\":3,\"timeout_seconds\":30}','2026-10-09 21:20:38'),('9490ebda-2453-4dc4-95cd-7bcfd6633879','c0654f0b-8452-4a03-a43d-0d0cda17da1b','integration_updated','9a2b7c27-7ff7-4c38-ad71-8b05b5e3ff7e','{\"enabled\":0,\"environment\":\"sandbox\",\"retry_count\":3,\"timeout_seconds\":30}','2026-10-09 21:20:38'),('97e48946-f26b-4e60-be95-52204858cc57','c0654f0b-8452-4a03-a43d-0d0cda17da1b','integration_updated','06feff4e-88d9-48c4-adf6-7ed37c3dd26b','{\"enabled\":0,\"environment\":\"sandbox\",\"retry_count\":3,\"timeout_seconds\":30}','2026-10-09 21:20:38'),('b6c1c4f1-a88d-41f2-9cbc-4b59a7217589','c0654f0b-8452-4a03-a43d-0d0cda17da1b','integration_updated','93e61074-1d3b-499e-a1b6-2eff0eb21cd5','{\"enabled\":0,\"environment\":\"sandbox\",\"retry_count\":3,\"timeout_seconds\":30}','2026-10-09 21:20:38'),('d19e9124-fe62-4c75-8626-d33543e62bd8','c0654f0b-8452-4a03-a43d-0d0cda17da1b','integration_settings_updated',NULL,'{\"correlation_id_logging\":1,\"dead_letter_queue_enabled\":1,\"circuit_breaker_enabled\":1,\"schema_validation_required\":1,\"manual_fallback_required\":0,\"retry_backoff_seconds\":30}','2026-10-09 21:20:38'),('d2707d41-ef00-4db1-9e9c-a43cec3c29fc','c0654f0b-8452-4a03-a43d-0d0cda17da1b','integration_updated','6341215c-14c6-41ce-ab63-0e29e4942fda','{\"enabled\":0,\"environment\":\"sandbox\",\"retry_count\":3,\"timeout_seconds\":30}','2026-10-09 21:20:38');
/*!40000 ALTER TABLE `integration_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `integration_credentials`
--

DROP TABLE IF EXISTS `integration_credentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `integration_credentials` (
  `id` char(36) NOT NULL,
  `integration_id` char(36) NOT NULL,
  `field_key` varchar(150) NOT NULL,
  `encrypted_value` mediumtext NOT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_integration_credential_field` (`integration_id`,`field_key`),
  KEY `idx_integration_credentials_updated_by` (`updated_by`),
  CONSTRAINT `fk_integration_credentials_adapter` FOREIGN KEY (`integration_id`) REFERENCES `integration_adapters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `integration_credentials`
--

LOCK TABLES `integration_credentials` WRITE;
/*!40000 ALTER TABLE `integration_credentials` DISABLE KEYS */;
/*!40000 ALTER TABLE `integration_credentials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `integration_settings`
--

DROP TABLE IF EXISTS `integration_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `integration_settings` (
  `id` char(36) NOT NULL,
  `correlation_id_logging` tinyint(1) NOT NULL DEFAULT 1,
  `dead_letter_queue_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `circuit_breaker_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `schema_validation_required` tinyint(1) NOT NULL DEFAULT 1,
  `manual_fallback_required` tinyint(1) NOT NULL DEFAULT 1,
  `retry_backoff_seconds` int(10) unsigned NOT NULL DEFAULT 30,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_integration_settings_singleton` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `integration_settings`
--

LOCK TABLES `integration_settings` WRITE;
/*!40000 ALTER TABLE `integration_settings` DISABLE KEYS */;
INSERT INTO `integration_settings` VALUES ('e205ca01-ee99-4e83-b2c8-f343d1af760c',1,1,1,1,0,30,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:03:12','2026-10-09 21:20:38');
/*!40000 ALTER TABLE `integration_settings` ENABLE KEYS */;
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
-- Table structure for table `notification_config_audit`
--

DROP TABLE IF EXISTS `notification_config_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_config_audit` (
  `id` char(36) NOT NULL,
  `config_version_id` char(36) NOT NULL,
  `actor_id` char(36) NOT NULL,
  `action` varchar(100) NOT NULL,
  `change_reason` varchar(500) NOT NULL,
  `before_json` longtext DEFAULT NULL,
  `after_json` longtext NOT NULL,
  `request_id` char(32) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_notification_audit_request` (`request_id`),
  KEY `idx_notification_audit_version` (`config_version_id`),
  KEY `idx_notification_audit_actor` (`actor_id`),
  KEY `idx_notification_audit_created` (`created_at`),
  CONSTRAINT `fk_notification_audit_version` FOREIGN KEY (`config_version_id`) REFERENCES `notification_config_versions` (`id`),
  CONSTRAINT `chk_notification_audit_after` CHECK (json_valid(`after_json`)),
  CONSTRAINT `chk_notification_audit_before` CHECK (`before_json` is null or json_valid(`before_json`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_config_audit`
--

LOCK TABLES `notification_config_audit` WRITE;
/*!40000 ALTER TABLE `notification_config_audit` DISABLE KEYS */;
INSERT INTO `notification_config_audit` VALUES ('40c6639b-49dc-4890-b836-1671ab1ed248','ed7dee61-e28a-45ec-90cf-328c6bfb6451','c0654f0b-8452-4a03-a43d-0d0cda17da1b','notification_configuration_updated','Notification configuration updated','{\"channels_enabled\":{\"email\":true,\"sms\":true},\"quiet_hours_enabled\":true,\"quiet_hours_start\":\"22:00\",\"quiet_hours_end\":\"07:00\",\"rate_limit_per_hour\":10,\"digest_frequency\":\"immediate\",\"fallback_channel_enabled\":true,\"retry_count\":3,\"track_delivery_status\":true,\"transactional_marketing_split\":true,\"internal_alerts\":{\"sla\":true,\"exceptions\":true,\"integrations\":true,\"security\":true}}','{\"channels_enabled\":{\"email\":true,\"sms\":true},\"quiet_hours_enabled\":true,\"quiet_hours_start\":\"22:00\",\"quiet_hours_end\":\"07:00\",\"rate_limit_per_hour\":10,\"digest_frequency\":\"immediate\",\"fallback_channel_enabled\":true,\"retry_count\":3,\"track_delivery_status\":true,\"transactional_marketing_split\":true,\"internal_alerts\":{\"sla\":true,\"exceptions\":true,\"integrations\":true,\"security\":true},\"events\":[{\"id\":\"5cc1b9d5-e80e-4f39-929b-639fb2f1ca82\",\"key\":\"cargo_positioned\",\"label\":\"Cargo Positioned\",\"channels\":[\"email\",\"sms\"],\"template\":\"cargo_positioned\",\"mandatory\":false},{\"id\":\"59cb11d6-3bac-49e1-a43a-95f7cec98fb9\",\"key\":\"cargo_received\",\"label\":\"Cargo Received\",\"channels\":[\"email\",\"sms\"],\"template\":\"cargo_received\",\"mandatory\":false},{\"id\":\"cd9b8ed0-b236-4eef-b0c3-a580b3dbeff4\",\"key\":\"collection_ready\",\"label\":\"Collection Ready\",\"channels\":[\"email\",\"sms\"],\"template\":\"collection_ready\",\"mandatory\":false},{\"id\":\"a20ac0a9-d688-4856-a394-6ddcf728723d\",\"key\":\"document_issued\",\"label\":\"Document Issued\",\"channels\":[\"email\",\"sms\"],\"template\":\"document_issued\",\"mandatory\":false},{\"id\":\"a7e8465b-b839-4e10-9504-65e5e2d85390\",\"key\":\"examination_scheduled\",\"label\":\"Examination Scheduled\",\"channels\":[\"email\",\"sms\"],\"template\":\"examination_scheduled\",\"mandatory\":false},{\"id\":\"cc20fda7-4553-4d2a-9ebd-1ce4dd3937e3\",\"key\":\"hold_placed\",\"label\":\"Hold Placed\",\"channels\":[\"email\",\"sms\"],\"template\":\"hold_placed\",\"mandatory\":true},{\"id\":\"a3f3b274-af3d-4dcc-bb2e-a338faa08144\",\"key\":\"invoice_issued\",\"label\":\"Invoice Issued\",\"channels\":[\"email\",\"sms\"],\"template\":\"invoice_issued\",\"mandatory\":false},{\"id\":\"b8999deb-b37f-49e0-8a1d-8f0d02c2c754\",\"key\":\"overstay_escalation\",\"label\":\"Overstay Escalation\",\"channels\":[\"email\",\"sms\"],\"template\":\"overstay_escalation\",\"mandatory\":false},{\"id\":\"fcf32b23-db8a-4cbc-b688-35f2b3d3938a\",\"key\":\"payment_received\",\"label\":\"Payment Received\",\"channels\":[\"email\",\"sms\"],\"template\":\"payment_received\",\"mandatory\":false},{\"id\":\"2d97bb13-36dc-49dc-b050-234ff112eb12\",\"key\":\"release_authorised\",\"label\":\"Release Authorised\",\"channels\":[\"email\",\"sms\"],\"template\":\"release_authorised\",\"mandatory\":true},{\"id\":\"55ceb154-12a3-4f6e-9d46-f78bf6ea6510\",\"key\":\"slot_confirmed\",\"label\":\"Slot Confirmed\",\"channels\":[\"email\",\"sms\"],\"template\":\"slot_confirmed\",\"mandatory\":false},{\"id\":\"1224c2cf-36df-4f9e-9b73-14344722ef65\",\"key\":\"storage_deadline\",\"label\":\"Storage Deadline\",\"channels\":[\"email\",\"sms\"],\"template\":\"storage_deadline\",\"mandatory\":true}]}','27fbd1e540ced92610262daa83f2944f','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-09 20:31:46'),('69360078-d4e8-4fba-94c9-d1c3afe8fbe6','059ab261-b711-49d2-81d5-f4321140730a','c0654f0b-8452-4a03-a43d-0d0cda17da1b','notification_configuration_updated','Notification configuration updated','{\"channels_enabled\":{\"email\":true,\"sms\":true},\"quiet_hours_enabled\":true,\"quiet_hours_start\":\"22:00\",\"quiet_hours_end\":\"07:00\",\"rate_limit_per_hour\":10,\"digest_frequency\":\"immediate\",\"fallback_channel_enabled\":true,\"retry_count\":3,\"track_delivery_status\":true,\"transactional_marketing_split\":true,\"internal_alerts\":{\"sla\":true,\"exceptions\":true,\"integrations\":true,\"security\":true},\"events\":[{\"id\":\"5cc1b9d5-e80e-4f39-929b-639fb2f1ca82\",\"key\":\"cargo_positioned\",\"label\":\"Cargo Positioned\",\"channels\":[\"email\",\"sms\"],\"template\":\"cargo_positioned\",\"mandatory\":false},{\"id\":\"59cb11d6-3bac-49e1-a43a-95f7cec98fb9\",\"key\":\"cargo_received\",\"label\":\"Cargo Received\",\"channels\":[\"email\",\"sms\"],\"template\":\"cargo_received\",\"mandatory\":false},{\"id\":\"cd9b8ed0-b236-4eef-b0c3-a580b3dbeff4\",\"key\":\"collection_ready\",\"label\":\"Collection Ready\",\"channels\":[\"email\",\"sms\"],\"template\":\"collection_ready\",\"mandatory\":false},{\"id\":\"a20ac0a9-d688-4856-a394-6ddcf728723d\",\"key\":\"document_issued\",\"label\":\"Document Issued\",\"channels\":[\"email\",\"sms\"],\"template\":\"document_issued\",\"mandatory\":false},{\"id\":\"a7e8465b-b839-4e10-9504-65e5e2d85390\",\"key\":\"examination_scheduled\",\"label\":\"Examination Scheduled\",\"channels\":[\"email\",\"sms\"],\"template\":\"examination_scheduled\",\"mandatory\":false},{\"id\":\"cc20fda7-4553-4d2a-9ebd-1ce4dd3937e3\",\"key\":\"hold_placed\",\"label\":\"Hold Placed\",\"channels\":[\"email\",\"sms\"],\"template\":\"hold_placed\",\"mandatory\":true},{\"id\":\"a3f3b274-af3d-4dcc-bb2e-a338faa08144\",\"key\":\"invoice_issued\",\"label\":\"Invoice Issued\",\"channels\":[\"email\",\"sms\"],\"template\":\"invoice_issued\",\"mandatory\":false},{\"id\":\"b8999deb-b37f-49e0-8a1d-8f0d02c2c754\",\"key\":\"overstay_escalation\",\"label\":\"Overstay Escalation\",\"channels\":[\"email\",\"sms\"],\"template\":\"overstay_escalation\",\"mandatory\":false},{\"id\":\"fcf32b23-db8a-4cbc-b688-35f2b3d3938a\",\"key\":\"payment_received\",\"label\":\"Payment Received\",\"channels\":[\"email\",\"sms\"],\"template\":\"payment_received\",\"mandatory\":false},{\"id\":\"2d97bb13-36dc-49dc-b050-234ff112eb12\",\"key\":\"release_authorised\",\"label\":\"Release Authorised\",\"channels\":[\"email\",\"sms\"],\"template\":\"release_authorised\",\"mandatory\":true},{\"id\":\"55ceb154-12a3-4f6e-9d46-f78bf6ea6510\",\"key\":\"slot_confirmed\",\"label\":\"Slot Confirmed\",\"channels\":[\"email\",\"sms\"],\"template\":\"slot_confirmed\",\"mandatory\":false},{\"id\":\"1224c2cf-36df-4f9e-9b73-14344722ef65\",\"key\":\"storage_deadline\",\"label\":\"Storage Deadline\",\"channels\":[\"email\",\"sms\"],\"template\":\"storage_deadline\",\"mandatory\":true}]}','{\"channels_enabled\":{\"email\":true,\"sms\":true},\"quiet_hours_enabled\":true,\"quiet_hours_start\":\"22:00\",\"quiet_hours_end\":\"07:00\",\"rate_limit_per_hour\":10,\"digest_frequency\":\"immediate\",\"fallback_channel_enabled\":true,\"retry_count\":3,\"track_delivery_status\":true,\"transactional_marketing_split\":true,\"internal_alerts\":{\"sla\":true,\"exceptions\":true,\"integrations\":true,\"security\":true},\"events\":[{\"id\":\"5cc1b9d5-e80e-4f39-929b-639fb2f1ca82\",\"key\":\"cargo_positioned\",\"label\":\"Cargo Positioned\",\"channels\":[\"email\",\"sms\"],\"template\":\"cargo_positioned\",\"mandatory\":false},{\"id\":\"59cb11d6-3bac-49e1-a43a-95f7cec98fb9\",\"key\":\"cargo_received\",\"label\":\"Cargo Received\",\"channels\":[\"email\",\"sms\"],\"template\":\"cargo_received\",\"mandatory\":false},{\"id\":\"cd9b8ed0-b236-4eef-b0c3-a580b3dbeff4\",\"key\":\"collection_ready\",\"label\":\"Collection Ready\",\"channels\":[\"email\",\"sms\"],\"template\":\"collection_ready\",\"mandatory\":false},{\"id\":\"a20ac0a9-d688-4856-a394-6ddcf728723d\",\"key\":\"document_issued\",\"label\":\"Document Issued\",\"channels\":[\"email\",\"sms\"],\"template\":\"document_issued\",\"mandatory\":false},{\"id\":\"a7e8465b-b839-4e10-9504-65e5e2d85390\",\"key\":\"examination_scheduled\",\"label\":\"Examination Scheduled\",\"channels\":[\"email\",\"sms\"],\"template\":\"examination_scheduled\",\"mandatory\":false},{\"id\":\"cc20fda7-4553-4d2a-9ebd-1ce4dd3937e3\",\"key\":\"hold_placed\",\"label\":\"Hold Placed\",\"channels\":[\"email\",\"sms\"],\"template\":\"hold_placed\",\"mandatory\":true},{\"id\":\"a3f3b274-af3d-4dcc-bb2e-a338faa08144\",\"key\":\"invoice_issued\",\"label\":\"Invoice Issued\",\"channels\":[\"email\",\"sms\"],\"template\":\"invoice_issued\",\"mandatory\":false},{\"id\":\"b8999deb-b37f-49e0-8a1d-8f0d02c2c754\",\"key\":\"overstay_escalation\",\"label\":\"Overstay Escalation\",\"channels\":[\"email\",\"sms\"],\"template\":\"overstay_escalation\",\"mandatory\":false},{\"id\":\"fcf32b23-db8a-4cbc-b688-35f2b3d3938a\",\"key\":\"payment_received\",\"label\":\"Payment Received\",\"channels\":[\"email\",\"sms\"],\"template\":\"payment_received\",\"mandatory\":false},{\"id\":\"2d97bb13-36dc-49dc-b050-234ff112eb12\",\"key\":\"release_authorised\",\"label\":\"Release Authorised\",\"channels\":[\"email\",\"sms\"],\"template\":\"release_authorised\",\"mandatory\":true},{\"id\":\"55ceb154-12a3-4f6e-9d46-f78bf6ea6510\",\"key\":\"slot_confirmed\",\"label\":\"Slot Confirmed\",\"channels\":[\"email\",\"sms\"],\"template\":\"slot_confirmed\",\"mandatory\":false},{\"id\":\"1224c2cf-36df-4f9e-9b73-14344722ef65\",\"key\":\"storage_deadline\",\"label\":\"Storage Deadline\",\"channels\":[\"email\",\"sms\"],\"template\":\"storage_deadline\",\"mandatory\":true},{\"id\":\"0b326894-a11f-4d8f-b72a-bea6fbdc86c3\",\"key\":\"terr_ttt\",\"label\":\"Test\",\"channels\":[\"email\"],\"template\":\"hgshd\",\"mandatory\":false}]}','fb40fbad232e9e50695184662d18deb3','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36','2026-10-09 20:32:07');
/*!40000 ALTER TABLE `notification_config_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_config_events`
--

DROP TABLE IF EXISTS `notification_config_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_config_events` (
  `id` varchar(100) NOT NULL,
  `event_key` varchar(100) NOT NULL,
  `label` varchar(150) NOT NULL,
  `channels_json` longtext NOT NULL,
  `template` varchar(100) NOT NULL,
  `mandatory` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` char(36) NOT NULL,
  `updated_by` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_notification_event_key` (`event_key`),
  CONSTRAINT `chk_notification_event_channels` CHECK (json_valid(`channels_json`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_config_events`
--

LOCK TABLES `notification_config_events` WRITE;
/*!40000 ALTER TABLE `notification_config_events` DISABLE KEYS */;
INSERT INTO `notification_config_events` VALUES ('0b326894-a11f-4d8f-b72a-bea6fbdc86c3','terr_ttt','Test','[\"email\"]','hgshd',0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:32:07','2026-10-09 20:32:07'),('1224c2cf-36df-4f9e-9b73-14344722ef65','storage_deadline','Storage Deadline','[\"email\",\"sms\"]','storage_deadline',1,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:24:42','2026-10-09 20:31:46'),('2d97bb13-36dc-49dc-b050-234ff112eb12','release_authorised','Release Authorised','[\"email\",\"sms\"]','release_authorised',1,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:24:42','2026-10-09 20:24:42'),('55ceb154-12a3-4f6e-9d46-f78bf6ea6510','slot_confirmed','Slot Confirmed','[\"email\",\"sms\"]','slot_confirmed',0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:24:42','2026-10-09 20:24:42'),('59cb11d6-3bac-49e1-a43a-95f7cec98fb9','cargo_received','Cargo Received','[\"email\",\"sms\"]','cargo_received',0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:24:42','2026-10-09 20:24:42'),('5cc1b9d5-e80e-4f39-929b-639fb2f1ca82','cargo_positioned','Cargo Positioned','[\"email\",\"sms\"]','cargo_positioned',0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:24:42','2026-10-09 20:24:42'),('a20ac0a9-d688-4856-a394-6ddcf728723d','document_issued','Document Issued','[\"email\",\"sms\"]','document_issued',0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:24:42','2026-10-09 20:24:42'),('a3f3b274-af3d-4dcc-bb2e-a338faa08144','invoice_issued','Invoice Issued','[\"email\",\"sms\"]','invoice_issued',0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:24:42','2026-10-09 20:24:42'),('a7e8465b-b839-4e10-9504-65e5e2d85390','examination_scheduled','Examination Scheduled','[\"email\",\"sms\"]','examination_scheduled',0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:24:42','2026-10-09 20:24:42'),('b8999deb-b37f-49e0-8a1d-8f0d02c2c754','overstay_escalation','Overstay Escalation','[\"email\",\"sms\"]','overstay_escalation',0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:24:42','2026-10-09 20:24:42'),('cc20fda7-4553-4d2a-9ebd-1ce4dd3937e3','hold_placed','Hold Placed','[\"email\",\"sms\"]','hold_placed',1,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:24:42','2026-10-09 20:24:42'),('cd9b8ed0-b236-4eef-b0c3-a580b3dbeff4','collection_ready','Collection Ready','[\"email\",\"sms\"]','collection_ready',0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:24:42','2026-10-09 20:24:42'),('fcf32b23-db8a-4cbc-b688-35f2b3d3938a','payment_received','Payment Received','[\"email\",\"sms\"]','payment_received',0,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:24:42','2026-10-09 20:24:42');
/*!40000 ALTER TABLE `notification_config_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_config_versions`
--

DROP TABLE IF EXISTS `notification_config_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_config_versions` (
  `id` char(36) NOT NULL,
  `version_no` int(10) unsigned NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT 0,
  `config_json` longtext NOT NULL,
  `change_reason` varchar(500) NOT NULL,
  `created_by` char(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_notification_config_version` (`version_no`),
  KEY `idx_notification_config_current` (`is_current`,`version_no`),
  CONSTRAINT `chk_notification_config_json` CHECK (json_valid(`config_json`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_config_versions`
--

LOCK TABLES `notification_config_versions` WRITE;
/*!40000 ALTER TABLE `notification_config_versions` DISABLE KEYS */;
INSERT INTO `notification_config_versions` VALUES ('059ab261-b711-49d2-81d5-f4321140730a',3,1,'{\"channels_enabled\":{\"email\":true,\"sms\":true},\"quiet_hours_enabled\":true,\"quiet_hours_start\":\"22:00\",\"quiet_hours_end\":\"07:00\",\"rate_limit_per_hour\":10,\"digest_frequency\":\"immediate\",\"fallback_channel_enabled\":true,\"retry_count\":3,\"track_delivery_status\":true,\"transactional_marketing_split\":true,\"internal_alerts\":{\"sla\":true,\"exceptions\":true,\"integrations\":true,\"security\":true},\"events\":[{\"id\":\"5cc1b9d5-e80e-4f39-929b-639fb2f1ca82\",\"key\":\"cargo_positioned\",\"label\":\"Cargo Positioned\",\"channels\":[\"email\",\"sms\"],\"template\":\"cargo_positioned\",\"mandatory\":false},{\"id\":\"59cb11d6-3bac-49e1-a43a-95f7cec98fb9\",\"key\":\"cargo_received\",\"label\":\"Cargo Received\",\"channels\":[\"email\",\"sms\"],\"template\":\"cargo_received\",\"mandatory\":false},{\"id\":\"cd9b8ed0-b236-4eef-b0c3-a580b3dbeff4\",\"key\":\"collection_ready\",\"label\":\"Collection Ready\",\"channels\":[\"email\",\"sms\"],\"template\":\"collection_ready\",\"mandatory\":false},{\"id\":\"a20ac0a9-d688-4856-a394-6ddcf728723d\",\"key\":\"document_issued\",\"label\":\"Document Issued\",\"channels\":[\"email\",\"sms\"],\"template\":\"document_issued\",\"mandatory\":false},{\"id\":\"a7e8465b-b839-4e10-9504-65e5e2d85390\",\"key\":\"examination_scheduled\",\"label\":\"Examination Scheduled\",\"channels\":[\"email\",\"sms\"],\"template\":\"examination_scheduled\",\"mandatory\":false},{\"id\":\"cc20fda7-4553-4d2a-9ebd-1ce4dd3937e3\",\"key\":\"hold_placed\",\"label\":\"Hold Placed\",\"channels\":[\"email\",\"sms\"],\"template\":\"hold_placed\",\"mandatory\":true},{\"id\":\"a3f3b274-af3d-4dcc-bb2e-a338faa08144\",\"key\":\"invoice_issued\",\"label\":\"Invoice Issued\",\"channels\":[\"email\",\"sms\"],\"template\":\"invoice_issued\",\"mandatory\":false},{\"id\":\"b8999deb-b37f-49e0-8a1d-8f0d02c2c754\",\"key\":\"overstay_escalation\",\"label\":\"Overstay Escalation\",\"channels\":[\"email\",\"sms\"],\"template\":\"overstay_escalation\",\"mandatory\":false},{\"id\":\"fcf32b23-db8a-4cbc-b688-35f2b3d3938a\",\"key\":\"payment_received\",\"label\":\"Payment Received\",\"channels\":[\"email\",\"sms\"],\"template\":\"payment_received\",\"mandatory\":false},{\"id\":\"2d97bb13-36dc-49dc-b050-234ff112eb12\",\"key\":\"release_authorised\",\"label\":\"Release Authorised\",\"channels\":[\"email\",\"sms\"],\"template\":\"release_authorised\",\"mandatory\":true},{\"id\":\"55ceb154-12a3-4f6e-9d46-f78bf6ea6510\",\"key\":\"slot_confirmed\",\"label\":\"Slot Confirmed\",\"channels\":[\"email\",\"sms\"],\"template\":\"slot_confirmed\",\"mandatory\":false},{\"id\":\"1224c2cf-36df-4f9e-9b73-14344722ef65\",\"key\":\"storage_deadline\",\"label\":\"Storage Deadline\",\"channels\":[\"email\",\"sms\"],\"template\":\"storage_deadline\",\"mandatory\":true},{\"id\":\"0b326894-a11f-4d8f-b72a-bea6fbdc86c3\",\"key\":\"terr_ttt\",\"label\":\"Test\",\"channels\":[\"email\"],\"template\":\"hgshd\",\"mandatory\":false}]}','Notification configuration updated','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:32:07'),('d90c509c-0544-4ea4-9ef2-f10795aace2f',1,0,'{\"channels_enabled\":{\"email\":true,\"sms\":true},\"quiet_hours_enabled\":true,\"quiet_hours_start\":\"22:00\",\"quiet_hours_end\":\"07:00\",\"rate_limit_per_hour\":10,\"digest_frequency\":\"immediate\",\"fallback_channel_enabled\":true,\"retry_count\":3,\"track_delivery_status\":true,\"transactional_marketing_split\":true,\"internal_alerts\":{\"sla\":true,\"exceptions\":true,\"integrations\":true,\"security\":true}}','Initial notification configuration','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:24:42'),('ed7dee61-e28a-45ec-90cf-328c6bfb6451',2,0,'{\"channels_enabled\":{\"email\":true,\"sms\":true},\"quiet_hours_enabled\":true,\"quiet_hours_start\":\"22:00\",\"quiet_hours_end\":\"07:00\",\"rate_limit_per_hour\":10,\"digest_frequency\":\"immediate\",\"fallback_channel_enabled\":true,\"retry_count\":3,\"track_delivery_status\":true,\"transactional_marketing_split\":true,\"internal_alerts\":{\"sla\":true,\"exceptions\":true,\"integrations\":true,\"security\":true},\"events\":[{\"id\":\"5cc1b9d5-e80e-4f39-929b-639fb2f1ca82\",\"key\":\"cargo_positioned\",\"label\":\"Cargo Positioned\",\"channels\":[\"email\",\"sms\"],\"template\":\"cargo_positioned\",\"mandatory\":false},{\"id\":\"59cb11d6-3bac-49e1-a43a-95f7cec98fb9\",\"key\":\"cargo_received\",\"label\":\"Cargo Received\",\"channels\":[\"email\",\"sms\"],\"template\":\"cargo_received\",\"mandatory\":false},{\"id\":\"cd9b8ed0-b236-4eef-b0c3-a580b3dbeff4\",\"key\":\"collection_ready\",\"label\":\"Collection Ready\",\"channels\":[\"email\",\"sms\"],\"template\":\"collection_ready\",\"mandatory\":false},{\"id\":\"a20ac0a9-d688-4856-a394-6ddcf728723d\",\"key\":\"document_issued\",\"label\":\"Document Issued\",\"channels\":[\"email\",\"sms\"],\"template\":\"document_issued\",\"mandatory\":false},{\"id\":\"a7e8465b-b839-4e10-9504-65e5e2d85390\",\"key\":\"examination_scheduled\",\"label\":\"Examination Scheduled\",\"channels\":[\"email\",\"sms\"],\"template\":\"examination_scheduled\",\"mandatory\":false},{\"id\":\"cc20fda7-4553-4d2a-9ebd-1ce4dd3937e3\",\"key\":\"hold_placed\",\"label\":\"Hold Placed\",\"channels\":[\"email\",\"sms\"],\"template\":\"hold_placed\",\"mandatory\":true},{\"id\":\"a3f3b274-af3d-4dcc-bb2e-a338faa08144\",\"key\":\"invoice_issued\",\"label\":\"Invoice Issued\",\"channels\":[\"email\",\"sms\"],\"template\":\"invoice_issued\",\"mandatory\":false},{\"id\":\"b8999deb-b37f-49e0-8a1d-8f0d02c2c754\",\"key\":\"overstay_escalation\",\"label\":\"Overstay Escalation\",\"channels\":[\"email\",\"sms\"],\"template\":\"overstay_escalation\",\"mandatory\":false},{\"id\":\"fcf32b23-db8a-4cbc-b688-35f2b3d3938a\",\"key\":\"payment_received\",\"label\":\"Payment Received\",\"channels\":[\"email\",\"sms\"],\"template\":\"payment_received\",\"mandatory\":false},{\"id\":\"2d97bb13-36dc-49dc-b050-234ff112eb12\",\"key\":\"release_authorised\",\"label\":\"Release Authorised\",\"channels\":[\"email\",\"sms\"],\"template\":\"release_authorised\",\"mandatory\":true},{\"id\":\"55ceb154-12a3-4f6e-9d46-f78bf6ea6510\",\"key\":\"slot_confirmed\",\"label\":\"Slot Confirmed\",\"channels\":[\"email\",\"sms\"],\"template\":\"slot_confirmed\",\"mandatory\":false},{\"id\":\"1224c2cf-36df-4f9e-9b73-14344722ef65\",\"key\":\"storage_deadline\",\"label\":\"Storage Deadline\",\"channels\":[\"email\",\"sms\"],\"template\":\"storage_deadline\",\"mandatory\":true}]}','Notification configuration updated','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 20:31:46');
/*!40000 ALTER TABLE `notification_config_versions` ENABLE KEYS */;
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
-- Table structure for table `security_config_audit_logs`
--

DROP TABLE IF EXISTS `security_config_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `security_config_audit_logs` (
  `id` char(36) NOT NULL,
  `actor_id` char(36) NOT NULL,
  `action` varchar(100) NOT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`details`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_security_audit_actor` (`actor_id`),
  KEY `idx_security_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_config_audit_logs`
--

LOCK TABLES `security_config_audit_logs` WRITE;
/*!40000 ALTER TABLE `security_config_audit_logs` DISABLE KEYS */;
INSERT INTO `security_config_audit_logs` VALUES ('5f4eb197-336d-4201-b105-f31a9c58c76c','c0654f0b-8452-4a03-a43d-0d0cda17da1b','security_configuration_updated','{\"mfa_mandatory_for_staff\":1,\"mfa_encouraged_for_trade\":0,\"reauthentication_for_sensitive_actions\":1,\"trusted_devices_enabled\":0,\"breached_password_screening\":1,\"progressive_lockout_enabled\":1,\"break_glass_requires_dual_approval\":1,\"regulator_read_only_access\":0,\"audit_all_auth_events\":1,\"security_alerts_enabled\":1,\"alert_on_privilege_changes\":1,\"alert_on_repeated_login_failures\":1,\"device_management_enabled\":1,\"remote_sign_out_enabled\":1,\"mfa_grace_period_hours\":24,\"session_timeout_minutes\":30,\"concurrent_sessions_allowed\":3,\"minimum_password_length\":12,\"lockout_threshold\":5,\"lockout_duration_minutes\":30,\"regulator_access_duration_hours\":24}','2026-10-09 21:29:43');
/*!40000 ALTER TABLE `security_config_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `security_settings`
--

DROP TABLE IF EXISTS `security_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `security_settings` (
  `id` char(36) NOT NULL,
  `mfa_mandatory_for_staff` tinyint(1) NOT NULL DEFAULT 1,
  `mfa_encouraged_for_trade` tinyint(1) NOT NULL DEFAULT 1,
  `mfa_grace_period_hours` smallint(5) unsigned NOT NULL DEFAULT 24,
  `session_timeout_minutes` smallint(5) unsigned NOT NULL DEFAULT 30,
  `concurrent_sessions_allowed` tinyint(3) unsigned NOT NULL DEFAULT 3,
  `reauthentication_for_sensitive_actions` tinyint(1) NOT NULL DEFAULT 1,
  `trusted_devices_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `breached_password_screening` tinyint(1) NOT NULL DEFAULT 1,
  `minimum_password_length` smallint(5) unsigned NOT NULL DEFAULT 12,
  `progressive_lockout_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `lockout_threshold` tinyint(3) unsigned NOT NULL DEFAULT 5,
  `lockout_duration_minutes` smallint(5) unsigned NOT NULL DEFAULT 30,
  `break_glass_requires_dual_approval` tinyint(1) NOT NULL DEFAULT 1,
  `regulator_read_only_access` tinyint(1) NOT NULL DEFAULT 0,
  `regulator_access_duration_hours` smallint(5) unsigned NOT NULL DEFAULT 24,
  `audit_all_auth_events` tinyint(1) NOT NULL DEFAULT 1,
  `security_alerts_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `alert_on_privilege_changes` tinyint(1) NOT NULL DEFAULT 1,
  `alert_on_repeated_login_failures` tinyint(1) NOT NULL DEFAULT 1,
  `device_management_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `remote_sign_out_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_settings`
--

LOCK TABLES `security_settings` WRITE;
/*!40000 ALTER TABLE `security_settings` DISABLE KEYS */;
INSERT INTO `security_settings` VALUES ('e3da774e-4c97-4fd8-a78f-9607ec1a1535',1,0,24,30,3,1,0,1,12,1,5,30,1,0,24,1,1,1,1,1,1,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 21:28:52','2026-10-09 21:29:43');
/*!40000 ALTER TABLE `security_settings` ENABLE KEYS */;
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
INSERT INTO `sessions` VALUES ('0997562a-0144-448b-a90d-063ffddd8167','ff20dfcf-f843-4cd3-a263-412210683de9','33b8ceaf16748dafd377c91d39e5e15c266ebbe4a0eae2619e2380d490b6fd46',NULL,'Firefox on Windows (Desktop)','unknown',NULL,NULL,'127.0.0.1','Abuja, FCT, Nigeria',0,1,'2026-10-01 18:00:50','2026-10-31 18:00:50',NULL,NULL,'2026-10-01 16:00:50'),('1198246b-102c-4adf-85b6-a0460cf9b95a','4a9ba8d5-93b6-4b65-af96-934920afcd18','397fb86b977b57e309ee610d0c7967197d58a6b4f8e994cb56be5d01666af187',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-03 15:30:23','2026-11-02 15:30:23',NULL,NULL,'2026-10-03 14:30:23'),('2632d7e9-af51-46e5-9b6f-dd62e125af17','4a9ba8d5-93b6-4b65-af96-934920afcd18','a196a7f8508b401cac5197ca1458e65bad8d19eeb0d0af1de05cd57d11e618dc',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-03 14:46:01','2026-11-02 14:46:01',NULL,NULL,'2026-10-03 13:46:01'),('3881279e-11ea-4f3c-9d76-11927c1c28ac','ff20dfcf-f843-4cd3-a263-412210683de9','24218105a69709b7eab7a7efdfa80417e9ab77cbf3344d0195c182a3eaa784c3',NULL,'Firefox on Windows (Desktop)','unknown',NULL,NULL,'127.0.0.1','Abuja, FCT, Nigeria',0,1,'2026-10-02 12:53:24','2026-11-01 12:53:24',NULL,NULL,'2026-10-02 10:53:24'),('3f779800-112f-4a40-b843-f8f03022325d','c0654f0b-8452-4a03-a43d-0d0cda17da1b','62f098acd16856c52d6fbb85725b83492b446893667f97a1f860302b74410753',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-03 12:36:27','2026-11-02 12:36:27',NULL,NULL,'2026-10-03 11:36:27'),('63ffc6d7-032d-435a-bdcf-6145ecb541c2','ff20dfcf-f843-4cd3-a263-412210683de9','fd54b95fe5fb1f4222c5491124179f80f3389ee8a6d955368df682690f48f1b4',NULL,'Firefox on Windows (Desktop)','unknown',NULL,NULL,'127.0.0.1','Abuja, FCT, Nigeria',0,1,'2026-10-01 18:20:13','2026-10-31 18:20:13',NULL,NULL,'2026-10-01 16:20:13'),('67e4f923-400e-4655-a67a-7e1bb74bcb24','ff20dfcf-f843-4cd3-a263-412210683de9','04fdd5b13e825690fa60d0de193c51a9d6f6b13e8c9235df9a412cdefc2c2c62',NULL,'Firefox on Windows (Desktop)','unknown',NULL,NULL,'127.0.0.1','Abuja, FCT, Nigeria',0,1,'2026-10-01 18:17:51','2026-10-31 18:17:51',NULL,NULL,'2026-10-01 16:17:51'),('68ef296d-8fc6-4a5f-856d-e983d5357d7e','4a9ba8d5-93b6-4b65-af96-934920afcd18','96ef396045b76fe8c218e4d3d0fdcddba9b997d9f87884a8b0d311c9f746ba32',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-03 15:01:42','2026-11-02 15:01:42',NULL,NULL,'2026-10-03 14:01:42'),('9b4fc236-f24e-4127-8259-d7816eeea03f','c0654f0b-8452-4a03-a43d-0d0cda17da1b','11a7d220a8950dc7dcaaf347897b5adc221d8d7ae134d0a27e971e0e67ea7cac',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-08 19:18:35','2026-10-10 22:41:02',NULL,NULL,'2026-10-08 18:18:35'),('b804baca-dfa2-4a05-8511-e10dcba17e0b','c0654f0b-8452-4a03-a43d-0d0cda17da1b','de7bb0dd59388fe82003ba00911fdfbeef18f2cdb8d7d6fbc67f8e402f455cbf',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-07 14:30:28','2026-11-06 14:30:28',NULL,NULL,'2026-10-07 13:30:28'),('d375207c-6fe5-4be1-a753-2fb2117b2663','4a9ba8d5-93b6-4b65-af96-934920afcd18','ad2d2dcc6eec3d2bb76177f7532a22bc0107420d4d1616146a48eccb494fc19f',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-03 15:32:30','2026-11-02 15:32:30',NULL,NULL,'2026-10-03 14:32:30'),('e13d005b-11b9-4521-ad27-95cc3a2b1e7d','4a9ba8d5-93b6-4b65-af96-934920afcd18','204e4cedeb31c34b6d4f828d89fc5892aad44955df0cbda4d144d081c407ee30',NULL,'Chrome on Windows (Desktop)','unknown',NULL,NULL,'::1','Abuja, FCT, Nigeria',0,1,'2026-10-07 15:17:14','2026-11-06 15:17:14',NULL,NULL,'2026-10-07 14:17:14');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `storage_config_audit`
--

DROP TABLE IF EXISTS `storage_config_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `storage_config_audit` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `config_id` bigint(20) unsigned NOT NULL,
  `actor_id` varchar(100) NOT NULL,
  `change_reason` varchar(500) NOT NULL,
  `previous_values` longtext DEFAULT NULL,
  `new_values` longtext NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_storage_audit_config` (`config_id`),
  KEY `idx_storage_audit_actor` (`actor_id`),
  KEY `idx_storage_audit_created` (`created_at`),
  CONSTRAINT `fk_storage_audit_config` FOREIGN KEY (`config_id`) REFERENCES `storage_config_versions` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `storage_config_audit`
--

LOCK TABLES `storage_config_audit` WRITE;
/*!40000 ALTER TABLE `storage_config_audit` DISABLE KEYS */;
INSERT INTO `storage_config_audit` VALUES (1,9000000,'c0654f0b-8452-4a03-a43d-0d0cda17da1b','ggmhgh','{\"base_rate\":10000,\"free_days\":5,\"charging_unit\":\"day\",\"minimum_charge\":0,\"currency_code\":\"NGN\",\"effective_from\":\"2026-10-09\",\"overstay_threshold_days\":30,\"overstay_escalation_days\":45,\"pause_on_hold\":false,\"pause_on_examination\":false,\"pause_on_customs_hold\":false,\"escalation_tiers\":[{\"from_day\":16,\"rate_multiplier\":1.5},{\"from_day\":31,\"rate_multiplier\":2}]}','{\"base_rate\":5000,\"free_days\":5,\"charging_unit\":\"day\",\"minimum_charge\":0,\"currency_code\":\"NGN\",\"effective_from\":\"2026-10-09\",\"overstay_threshold_days\":30,\"overstay_escalation_days\":45,\"pause_on_hold\":false,\"pause_on_examination\":false,\"pause_on_customs_hold\":false,\"change_reason\":\"ggmhgh\",\"escalation_tiers\":[{\"from_day\":16,\"rate_multiplier\":1.5},{\"from_day\":31,\"rate_multiplier\":2}]}','2026-10-09 17:41:06');
/*!40000 ALTER TABLE `storage_config_audit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `storage_config_versions`
--

DROP TABLE IF EXISTS `storage_config_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `storage_config_versions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `base_rate` decimal(18,2) NOT NULL,
  `free_days` int(10) unsigned NOT NULL DEFAULT 0,
  `charging_unit` enum('day','week','month') NOT NULL DEFAULT 'day',
  `minimum_charge` decimal(18,2) NOT NULL DEFAULT 0.00,
  `currency_code` char(3) NOT NULL DEFAULT 'NGN',
  `effective_from` date NOT NULL,
  `overstay_threshold_days` int(10) unsigned NOT NULL DEFAULT 30,
  `overstay_escalation_days` int(10) unsigned NOT NULL DEFAULT 45,
  `pause_on_hold` tinyint(1) NOT NULL DEFAULT 0,
  `pause_on_examination` tinyint(1) NOT NULL DEFAULT 0,
  `pause_on_customs_hold` tinyint(1) NOT NULL DEFAULT 0,
  `change_reason` varchar(500) NOT NULL,
  `created_by` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_storage_effective_from` (`effective_from`),
  KEY `idx_storage_effective_lookup` (`effective_from`,`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9000002 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `storage_config_versions`
--

LOCK TABLES `storage_config_versions` WRITE;
/*!40000 ALTER TABLE `storage_config_versions` DISABLE KEYS */;
INSERT INTO `storage_config_versions` VALUES (9000000,5000.00,5,'day',0.00,'NGN','2026-10-09',30,45,0,0,0,'ggmhgh','c0654f0b-8452-4a03-a43d-0d0cda17da1b','2026-10-09 17:32:28');
/*!40000 ALTER TABLE `storage_config_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `storage_escalation_tiers`
--

DROP TABLE IF EXISTS `storage_escalation_tiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `storage_escalation_tiers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `config_id` bigint(20) unsigned NOT NULL,
  `from_day` int(10) unsigned NOT NULL,
  `rate_multiplier` decimal(10,4) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_storage_tier_start` (`config_id`,`from_day`),
  KEY `idx_storage_tier_config` (`config_id`),
  CONSTRAINT `fk_storage_tier_config` FOREIGN KEY (`config_id`) REFERENCES `storage_config_versions` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `storage_escalation_tiers`
--

LOCK TABLES `storage_escalation_tiers` WRITE;
/*!40000 ALTER TABLE `storage_escalation_tiers` DISABLE KEYS */;
INSERT INTO `storage_escalation_tiers` VALUES (65,9000000,16,1.5000,'2026-10-09 17:41:06'),(66,9000000,31,2.0000,'2026-10-09 17:41:06');
/*!40000 ALTER TABLE `storage_escalation_tiers` ENABLE KEYS */;
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

-- Dump completed on 2026-10-09 22:41:12
