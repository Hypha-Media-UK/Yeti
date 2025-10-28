-- MySQL dump 10.13  Distrib 8.3.0, for Linux (x86_64)
--
-- Host: localhost    Database: staff_rota
-- ------------------------------------------------------
-- Server version	8.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `area_operational_hours`
--

DROP TABLE IF EXISTS `area_operational_hours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `area_operational_hours` (
  `id` int NOT NULL AUTO_INCREMENT,
  `area_type` enum('department','service') COLLATE utf8mb4_unicode_ci NOT NULL,
  `area_id` int NOT NULL,
  `day_of_week` tinyint NOT NULL COMMENT '1=Monday, 2=Tuesday, ..., 7=Sunday (ISO 8601)',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL COMMENT 'Can be <= start_time for shifts crossing midnight',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_area_day_time` (`area_type`,`area_id`,`day_of_week`,`start_time`,`end_time`),
  KEY `idx_area_lookup` (`area_type`,`area_id`),
  KEY `idx_day_lookup` (`day_of_week`),
  KEY `idx_area_day` (`area_type`,`area_id`,`day_of_week`),
  CONSTRAINT `area_operational_hours_chk_1` CHECK ((`day_of_week` between 1 and 7))
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `area_operational_hours`
--

LOCK TABLES `area_operational_hours` WRITE;
/*!40000 ALTER TABLE `area_operational_hours` DISABLE KEYS */;
INSERT INTO `area_operational_hours` VALUES (15,'department',34,1,'08:00:00','17:00:00','2025-10-26 18:11:42','2025-10-26 18:11:42'),(16,'department',34,2,'08:00:00','17:00:00','2025-10-26 18:11:42','2025-10-26 18:11:42'),(17,'department',34,3,'08:00:00','17:00:00','2025-10-26 18:11:42','2025-10-26 18:11:42'),(18,'department',34,4,'08:00:00','17:00:00','2025-10-26 18:11:42','2025-10-26 18:11:42'),(19,'department',34,5,'08:00:00','17:00:00','2025-10-26 18:11:42','2025-10-26 18:11:42'),(24,'service',5,1,'08:00:00','17:00:00','2025-10-26 18:55:08','2025-10-26 18:55:08'),(25,'service',5,2,'08:00:00','17:00:00','2025-10-26 18:55:08','2025-10-26 18:55:08'),(26,'service',8,1,'20:00:00','23:59:00','2025-10-26 18:55:08','2025-10-26 18:55:08'),(27,'service',8,2,'20:00:00','23:59:00','2025-10-26 18:55:08','2025-10-26 18:55:08'),(28,'service',4,1,'08:00:00','16:00:00','2025-10-27 10:21:54','2025-10-27 10:21:54'),(29,'service',4,2,'08:00:00','16:00:00','2025-10-27 10:21:54','2025-10-27 10:21:54'),(30,'service',4,3,'08:00:00','16:00:00','2025-10-27 10:21:54','2025-10-27 10:21:54'),(31,'service',4,4,'08:00:00','16:00:00','2025-10-27 10:21:54','2025-10-27 10:21:54'),(32,'service',4,5,'08:00:00','16:00:00','2025-10-27 10:21:54','2025-10-27 10:21:54'),(33,'service',3,1,'08:00:00','17:00:00','2025-10-27 12:21:45','2025-10-27 12:21:45'),(34,'service',3,2,'08:00:00','17:00:00','2025-10-27 12:21:45','2025-10-27 12:21:45'),(35,'service',3,3,'08:00:00','17:00:00','2025-10-27 12:21:45','2025-10-27 12:21:45'),(36,'service',3,4,'08:00:00','17:00:00','2025-10-27 12:21:45','2025-10-27 12:21:45'),(37,'service',2,1,'08:00:00','16:00:00','2025-10-27 13:39:56','2025-10-27 13:39:56'),(38,'service',2,2,'08:00:00','16:00:00','2025-10-27 13:39:56','2025-10-27 13:39:56'),(39,'service',2,3,'08:00:00','16:00:00','2025-10-27 13:39:56','2025-10-27 13:39:56'),(40,'service',2,4,'08:00:00','16:00:00','2025-10-27 13:39:56','2025-10-27 13:39:56'),(41,'service',2,5,'08:00:00','16:00:00','2025-10-27 13:39:56','2025-10-27 13:39:56'),(44,'department',45,1,'08:00:00','17:00:00','2025-10-27 16:04:32','2025-10-27 16:04:32'),(45,'department',45,2,'08:00:00','17:00:00','2025-10-27 16:04:32','2025-10-27 16:04:32'),(46,'department',45,3,'08:00:00','17:00:00','2025-10-27 16:04:32','2025-10-27 16:04:32'),(47,'department',45,4,'08:00:00','17:00:00','2025-10-27 16:04:32','2025-10-27 16:04:32'),(48,'department',45,5,'08:00:00','17:00:00','2025-10-27 16:04:32','2025-10-27 16:04:32'),(49,'service',1,1,'08:00:00','01:00:00','2025-10-27 18:19:07','2025-10-27 18:19:07'),(50,'service',1,2,'08:00:00','01:00:00','2025-10-27 18:19:07','2025-10-27 18:19:07'),(51,'service',1,3,'08:00:00','01:00:00','2025-10-27 18:19:07','2025-10-27 18:19:07'),(52,'service',1,4,'08:00:00','01:00:00','2025-10-27 18:19:07','2025-10-27 18:19:07'),(53,'service',1,5,'08:00:00','01:00:00','2025-10-27 18:19:07','2025-10-27 18:19:07'),(54,'service',1,6,'08:00:00','01:00:00','2025-10-27 18:19:07','2025-10-27 18:19:07'),(55,'service',1,7,'08:00:00','01:00:00','2025-10-27 18:19:07','2025-10-27 18:19:07');
/*!40000 ALTER TABLE `area_operational_hours` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `buildings`
--

DROP TABLE IF EXISTS `buildings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `buildings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `buildings`
--

LOCK TABLES `buildings` WRITE;
/*!40000 ALTER TABLE `buildings` DISABLE KEYS */;
INSERT INTO `buildings` VALUES (1,'Charlesworth',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14'),(2,'Ladysmith',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14'),(3,'Buckton Building',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14'),(4,'Etherow Building',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14'),(5,'New Century House',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14'),(6,'Werneth House',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14'),(7,'Stamford Unit',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14'),(8,'Renal Unit',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14'),(9,'Main Stores',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14'),(10,'Silver Springs',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14'),(11,'Springhill',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14'),(12,'Hartshead',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14'),(13,'Macmillan Unit',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14'),(14,'Astley House',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14'),(15,'Portland House',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14'),(16,'Mellor House',NULL,1,'2025-10-26 11:11:14','2025-10-26 11:11:14');
/*!40000 ALTER TABLE `buildings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `config`
--

DROP TABLE IF EXISTS `config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  KEY `idx_key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config`
--

LOCK TABLES `config` WRITE;
/*!40000 ALTER TABLE `config` DISABLE KEYS */;
INSERT INTO `config` VALUES (1,'app_zero_date','2024-01-01','2025-10-26 09:45:23','2025-10-26 09:45:23'),(2,'time_zone','Europe/London','2025-10-26 09:45:23','2025-10-26 09:45:23');
/*!40000 ALTER TABLE `config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `building_id` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `include_in_main_rota` tinyint(1) DEFAULT '0',
  `is_24_7` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_building_id` (`building_id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_departments_is_24_7` (`is_24_7`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=67 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,'Ward 27',1,NULL,0,1,1,'2025-10-26 11:11:16','2025-10-27 16:03:43'),(2,'Ward 30 (HCU)',1,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(3,'Ward 31',1,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(4,'Acorn Birth Center',1,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(5,'Labour Ward',1,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(6,'NICU',1,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(7,'Maternity Triage',1,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(8,'Women\'s Health',1,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(9,'Ante-Natal Unit',1,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(10,'Security',1,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(11,'Ward 40',2,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(12,'Ward 41',2,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(13,'Ward 42',2,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(14,'Ward 43',2,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(15,'Ward 44',2,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(16,'Ward 45',2,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(17,'Ward 46',2,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(18,'Xray 4',2,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(19,'Walkerwood Unit',3,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(20,'Saxon Ward',4,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(21,'Summers Ward',4,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(22,'Hague Ward',4,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(23,'Infection Control',5,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(24,'Library',6,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(25,'Lecture Theatre',6,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(26,'Classrooms',6,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(27,'Stamford Ground',7,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(28,'Stamford 1st Floor',7,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(29,'Stamford 2nd Floor',7,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(30,'Renal Ward',8,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(31,'Supplies',9,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(32,'Offices',10,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(33,'Offices',11,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(34,'AMU',12,NULL,1,0,1,'2025-10-26 11:11:16','2025-10-26 18:01:04'),(35,'IAU',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(36,'ACU',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(37,'ITU',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(38,'Theatres North',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(39,'Theatres South',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(40,'DSEU',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(41,'Children\'s O+A',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(42,'Children\'s Unit',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(43,'Children\'s Outpatients',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(44,'Clinics A-F',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(45,'G/F Xray',12,NULL,1,0,1,'2025-10-26 11:11:16','2025-10-27 15:41:19'),(46,'Green Suite',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(47,'Plaster Room',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(48,'Discharge Lounge',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(49,'ISGU',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(50,'ED (A+E)',12,NULL,1,1,1,'2025-10-26 11:11:16','2025-10-26 20:39:12'),(51,'L/G/F Xray',12,NULL,1,1,1,'2025-10-26 11:11:16','2025-10-27 15:41:37'),(52,'L/G/F CT Scan',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(53,'MRI',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(54,'Walk in Center',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(55,'Mattress Store',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(56,'Pharmacy',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(57,'Swan Room',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(58,'Parking Office',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(59,'CRI',12,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(60,'Macmillan',13,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(61,'Mattress Store',14,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(62,'Laundry',15,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(63,'Porters Lodge',15,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(64,'I.T.',15,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(65,'Equipment Repair',15,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16'),(66,'Meeting Rooms',16,NULL,0,0,1,'2025-10-26 11:11:16','2025-10-26 11:11:16');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fixed_schedules`
--

DROP TABLE IF EXISTS `fixed_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fixed_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `day_of_week` tinyint DEFAULT NULL COMMENT '1=Monday, 7=Sunday, NULL=all days',
  `shift_start` time NOT NULL,
  `shift_end` time NOT NULL,
  `effective_from` date DEFAULT NULL,
  `effective_to` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_staff_id` (`staff_id`),
  KEY `idx_effective_dates` (`staff_id`,`effective_from`,`effective_to`),
  CONSTRAINT `fixed_schedules_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fixed_schedules`
--

LOCK TABLES `fixed_schedules` WRITE;
/*!40000 ALTER TABLE `fixed_schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `fixed_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `manual_assignments`
--

DROP TABLE IF EXISTS `manual_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manual_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `assignment_date` date NOT NULL,
  `shift_type` enum('Day','Night') COLLATE utf8mb4_unicode_ci NOT NULL,
  `area_type` enum('department','service') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area_id` int DEFAULT NULL,
  `shift_start` time DEFAULT NULL COMMENT 'Shift start time (NULL uses default for shift type)',
  `shift_end` time DEFAULT NULL COMMENT 'Shift end time (NULL uses default for shift type)',
  `start_time` time DEFAULT NULL COMMENT 'Start time for temporary assignment',
  `end_time` time DEFAULT NULL COMMENT 'End time for temporary assignment',
  `end_date` date DEFAULT NULL COMMENT 'End date for multi-day assignments',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_staff_date_shift` (`staff_id`,`assignment_date`,`shift_type`),
  KEY `idx_assignment_date` (`assignment_date`),
  KEY `idx_area_assignment` (`area_type`,`area_id`,`assignment_date`),
  CONSTRAINT `manual_assignments_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `manual_assignments`
--

LOCK TABLES `manual_assignments` WRITE;
/*!40000 ALTER TABLE `manual_assignments` DISABLE KEYS */;
INSERT INTO `manual_assignments` VALUES (31,1,'2025-10-27','Day','department',1,NULL,NULL,'15:00:00','19:00:00',NULL,'Test temporary assignment','2025-10-27 11:09:24','2025-10-27 11:09:24'),(33,50,'2025-10-28','Day','department',2,NULL,NULL,'08:00:00','16:00:00','2025-10-30','Multi-day assignment test (Oct 28-30)','2025-10-27 11:31:23','2025-10-27 11:31:23'),(34,75,'2025-10-28','Day','department',1,NULL,NULL,'08:00:00','16:00:00','2025-10-30','Multi-day assignment test for Carla (Oct 28-30)','2025-10-27 11:32:17','2025-10-27 11:32:17');
/*!40000 ALTER TABLE `manual_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `services` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `include_in_main_rota` tinyint(1) DEFAULT '0',
  `is_24_7` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_services_is_24_7` (`is_24_7`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,'Patient Transport Services',NULL,1,0,1,'2025-10-26 15:41:12','2025-10-27 18:19:07'),(2,'Medical Records',NULL,1,0,1,'2025-10-26 15:41:12','2025-10-27 12:22:10'),(3,'Blood Drivers',NULL,1,0,1,'2025-10-26 15:41:12','2025-10-27 12:21:45'),(4,'Post',NULL,1,0,1,'2025-10-26 15:41:12','2025-10-27 10:21:54'),(5,'Laundry',NULL,1,0,1,'2025-10-26 15:41:12','2025-10-26 16:20:41'),(6,'External Waste',NULL,1,0,1,'2025-10-26 15:41:12','2025-10-27 12:21:54'),(7,'Internal Waste (Sharps)',NULL,1,0,1,'2025-10-26 15:41:12','2025-10-27 12:22:01'),(8,'Ad-Hoc',NULL,1,0,1,'2025-10-26 15:41:12','2025-10-26 16:18:29'),(9,'District Drivers',NULL,1,0,1,'2025-10-26 15:41:12','2025-10-27 12:21:50');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shifts`
--

DROP TABLE IF EXISTS `shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shifts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('day','night') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Determines which shift column staff appear in',
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#3B82F6' COMMENT 'Hex color for UI display',
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shifts`
--

LOCK TABLES `shifts` WRITE;
/*!40000 ALTER TABLE `shifts` DISABLE KEYS */;
INSERT INTO `shifts` VALUES (1,'Day Shift','day','#E5F6FF','Default day shift (08:00-20:00)',1,'2025-10-27 10:12:55','2025-10-27 10:19:57'),(2,'Night Shift','night','#E8D2FE','Default night shift (20:00-08:00)',1,'2025-10-27 10:12:55','2025-10-27 10:20:17'),(3,'A Shift','day','#10B981','Morning shift team A',0,'2025-10-27 10:14:20','2025-10-27 10:19:15');
/*!40000 ALTER TABLE `shifts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Regular','Relief','Supervisor') COLLATE utf8mb4_unicode_ci NOT NULL,
  `shift_id` int DEFAULT NULL,
  `cycle_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `days_offset` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `custom_shift_start` time DEFAULT NULL,
  `custom_shift_end` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_shift_id` (`shift_id`),
  CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`shift_id`) REFERENCES `shifts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,'Alan','Clark','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 10:13:15',NULL,NULL),(2,'Alan','Kelly','Regular',2,'4-on-4-off',4,1,'2025-10-26 11:03:50','2025-10-27 14:03:30',NULL,NULL),(3,'Andrew','Gibson','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 12:00:23',NULL,NULL),(4,'Andrew','Hassall','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 10:13:15',NULL,NULL),(5,'Andrew','Trudgeon','Regular',1,'4-on-4-off',4,1,'2025-10-26 11:03:50','2025-10-27 16:23:06','10:00:00','22:00:00'),(6,'Brian','Cassidy','Regular',2,'4-on-4-off',4,1,'2025-10-26 11:03:50','2025-10-27 14:03:02',NULL,NULL),(7,'Chris','Huckaby','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 10:13:15',NULL,NULL),(8,'Chris','Roach','Regular',1,'4-on-4-off',2,1,'2025-10-26 11:03:50','2025-10-27 16:21:34',NULL,NULL),(9,'Chris','Wardle','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 13:39:01',NULL,NULL),(10,'Colin','Bromley','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 10:13:15',NULL,NULL),(11,'Craig','Butler','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 10:13:15',NULL,NULL),(12,'Darren','Flowers','Regular',2,'4-on-4-off',4,1,'2025-10-26 11:03:50','2025-10-27 14:03:13',NULL,NULL),(13,'Darren','Milhench','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 10:13:15',NULL,NULL),(14,'Darren','Mycroft','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 10:13:15',NULL,NULL),(15,'David','Sykes','Relief',NULL,NULL,0,1,'2025-10-26 11:03:50','2025-10-27 14:11:33',NULL,NULL),(16,'Dean','Pickering','Regular',1,'4-on-4-off',4,1,'2025-10-26 11:03:50','2025-10-27 10:13:15',NULL,NULL),(17,'Duane','Kulikowski','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 12:03:25',NULL,NULL),(18,'Edward','Collier','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:54:35',NULL,NULL),(19,'Gary','Booth','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:49:45',NULL,NULL),(20,'Gary','Bromley','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:52:08',NULL,NULL),(21,'Gavin','Marsden','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 12:04:04',NULL,NULL),(22,'Ian','Moss','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 12:04:47',NULL,NULL),(23,'Ian','Speakes','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 14:15:02',NULL,NULL),(24,'Jake','Moran','Relief',NULL,NULL,0,1,'2025-10-26 11:03:50','2025-10-27 12:04:33',NULL,NULL),(25,'James','Bennett','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:44:59',NULL,NULL),(26,'James','Mitchell','Regular',2,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 12:04:25',NULL,NULL),(27,'Jason','Newton','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 12:05:58',NULL,NULL),(28,'Jeff','Robinson','Regular',NULL,'4-on-4-off',4,1,'2025-10-26 11:03:50','2025-10-27 14:22:15',NULL,NULL),(29,'Joe','Redfearn','Regular',2,'4-on-4-off',2,1,'2025-10-26 11:03:50','2025-10-27 14:13:38',NULL,NULL),(30,'John','Evans','Regular',1,'4-on-4-off',4,1,'2025-10-26 11:03:50','2025-10-27 16:20:07',NULL,NULL),(31,'Jordon','Fish','Regular',1,'4-on-4-off',4,1,'2025-10-26 11:03:50','2025-10-27 16:20:14',NULL,NULL),(32,'Kevin','Gaskell','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:43:24',NULL,NULL),(33,'Kevin','Tomlinson','Regular',1,'4-on-4-off',2,1,'2025-10-26 11:03:50','2025-10-27 10:13:15',NULL,NULL),(34,'Kyle','Blackshaw','Relief',NULL,NULL,0,1,'2025-10-26 11:03:50','2025-10-27 11:49:28',NULL,NULL),(35,'Kyle','Sanderson','Regular',1,'4-on-4-off',2,1,'2025-10-26 11:03:50','2025-10-27 10:13:15',NULL,NULL),(36,'Lee','Stafford','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 16:22:46',NULL,NULL),(37,'Lewis','Yearsley','Regular',2,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 13:38:27',NULL,NULL),(38,'Mark','Dickinson','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:55:46',NULL,NULL),(39,'Mark','Haughton','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 12:02:17',NULL,NULL),(40,'Mark','Lloyd','Regular',NULL,'4-on-4-off',2,1,'2025-10-26 11:03:50','2025-10-27 12:03:48',NULL,NULL),(41,'Mark','Walton','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 16:24:04',NULL,NULL),(42,'Martin','Hobson','Regular',2,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 12:02:41',NULL,NULL),(43,'Martin','Kenyon','Regular',2,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 14:01:50',NULL,NULL),(44,'Matthew','Bennett','Regular',1,'4-on-4-off',4,1,'2025-10-26 11:03:50','2025-10-27 11:48:10',NULL,NULL),(45,'Matthew','Cope','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 16:19:58',NULL,NULL),(46,'Matthew','Rushton','Regular',1,'4-on-4-off',6,1,'2025-10-26 11:03:50','2025-10-27 10:13:15',NULL,NULL),(47,'Merv','Permalloo','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 16:21:10',NULL,NULL),(48,'Michael','Shaw','Regular',1,'4-on-4-off',2,1,'2025-10-26 11:03:50','2025-10-27 16:21:52','16:00:00','20:00:00'),(49,'Mike','Brennan','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:51:09',NULL,NULL),(50,'Nigel','Beesley','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:44:07',NULL,NULL),(51,'Paul','Berry','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:49:13',NULL,NULL),(52,'Paul','Fisher','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:56:21',NULL,NULL),(53,'Paul','Flowers','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:57:06',NULL,NULL),(54,'Peter','Moss','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 12:05:16',NULL,NULL),(55,'Phil','Hollinshead','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 15:40:36',NULL,NULL),(56,'Regan','Stringer','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 16:22:58',NULL,NULL),(57,'Rob','Mcpartland','Regular',1,'4-on-4-off',4,1,'2025-10-26 11:03:50','2025-10-27 16:20:48',NULL,NULL),(58,'Robert','Frost','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:59:03',NULL,NULL),(59,'Roy','Harris','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 12:01:16',NULL,NULL),(60,'Scott','Cartledge','Regular',2,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:53:13',NULL,NULL),(61,'Simon','Collins','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:55:02',NULL,NULL),(62,'Soloman','Offei','Relief',NULL,NULL,0,1,'2025-10-26 11:03:50','2025-10-27 14:01:13',NULL,NULL),(63,'Stepen','Bowater','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:50:03',NULL,NULL),(64,'Stephen','Burke','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:52:53',NULL,NULL),(65,'Stephen','Cooper','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:42:06',NULL,NULL),(66,'Stephen','Kirk','Regular',2,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 14:47:06','22:00:00','06:00:00'),(67,'Stephen','Scarsbrook','Regular',1,'4-on-4-off',4,1,'2025-10-26 11:03:50','2025-10-27 14:13:03',NULL,NULL),(68,'Steven','Richardson','Regular',1,'4-on-4-off',3,1,'2025-10-26 11:03:50','2025-10-27 14:12:20',NULL,NULL),(69,'Stuart','Ford','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:58:32',NULL,NULL),(70,'Stuart','Lomas','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 14:12:41',NULL,NULL),(71,'Tomas','Konkol','Regular',2,'4-on-4-off',3,1,'2025-10-26 11:03:50','2025-10-27 14:03:41',NULL,NULL),(72,'Tony','Batters','Regular',2,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 11:41:03',NULL,NULL),(73,'Allen','Butler','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 14:05:58',NULL,NULL),(74,'Andy','Clayton','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 14:10:33',NULL,NULL),(75,'Carla','Barton','Regular',1,'4-on-4-off',4,1,'2025-10-26 11:03:50','2025-10-27 11:43:45',NULL,NULL),(76,'Charlotte','Rimmer','Regular',1,'4-on-4-off',4,1,'2025-10-26 11:03:50','2025-10-27 14:06:12',NULL,NULL),(77,'A','J','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 14:10:06',NULL,NULL),(78,'Eloisa','Andrew','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 10:13:15',NULL,NULL),(79,'Julie','Greenough','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 14:08:11',NULL,NULL),(80,'Karen','Blackett','Regular',2,'4-on-4-off',4,1,'2025-10-26 11:03:50','2025-10-27 14:07:30',NULL,NULL),(81,'Lucy','Redfearn','Regular',1,'4-on-4-off',4,1,'2025-10-26 11:03:50','2025-10-27 14:08:23',NULL,NULL),(82,'Lynne','Warner','Regular',1,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 14:08:47',NULL,NULL),(83,'Nicola','Benger','Regular',NULL,'4-on-4-off',0,1,'2025-10-26 11:03:50','2025-10-27 14:09:37',NULL,NULL),(85,'Test','Allocation','Regular',1,'4-on-4-off',0,0,'2025-10-26 16:18:15','2025-10-27 10:13:15',NULL,NULL),(86,'Lee','Boswell','Relief',NULL,NULL,0,1,'2025-10-27 14:11:12','2025-10-27 14:11:12',NULL,NULL),(87,'Martin','Smith','Supervisor',NULL,'supervisor',0,1,'2025-10-27 16:08:46','2025-10-27 16:08:46',NULL,NULL);
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_absences`
--

DROP TABLE IF EXISTS `staff_absences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_absences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `absence_type` enum('sickness','annual_leave','training','absence') COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_staff_id` (`staff_id`),
  KEY `idx_date_range` (`start_datetime`,`end_datetime`),
  CONSTRAINT `staff_absences_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_absences`
--

LOCK TABLES `staff_absences` WRITE;
/*!40000 ALTER TABLE `staff_absences` DISABLE KEYS */;
INSERT INTO `staff_absences` VALUES (3,25,'absence','2025-10-28 08:30:00','2025-10-28 08:37:00',NULL,'2025-10-28 08:30:54','2025-10-28 08:30:54'),(5,73,'absence','2025-10-28 09:35:00','2025-10-28 09:37:00',NULL,'2025-10-28 09:35:28','2025-10-28 09:35:28');
/*!40000 ALTER TABLE `staff_absences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_allocations`
--

DROP TABLE IF EXISTS `staff_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_allocations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `area_type` enum('department','service') COLLATE utf8mb4_unicode_ci NOT NULL,
  `area_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_allocation` (`staff_id`,`area_type`,`area_id`),
  KEY `idx_staff_id` (`staff_id`),
  KEY `idx_area_type_id` (`area_type`,`area_id`),
  KEY `idx_area_lookup` (`area_type`,`area_id`,`staff_id`),
  CONSTRAINT `staff_allocations_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_allocations`
--

LOCK TABLES `staff_allocations` WRITE;
/*!40000 ALTER TABLE `staff_allocations` DISABLE KEYS */;
INSERT INTO `staff_allocations` VALUES (5,7,'service',8,'2025-10-26 16:08:04','2025-10-26 16:08:04'),(7,85,'department',4,'2025-10-26 16:18:22','2025-10-26 16:18:22'),(8,85,'service',8,'2025-10-26 16:18:22','2025-10-26 16:18:22'),(14,51,'service',3,'2025-10-27 11:49:13','2025-10-27 11:49:13'),(15,19,'service',1,'2025-10-27 11:49:45','2025-10-27 11:49:45'),(16,63,'service',1,'2025-10-27 11:50:03','2025-10-27 11:50:03'),(17,49,'service',7,'2025-10-27 11:51:09','2025-10-27 11:51:09'),(18,10,'service',1,'2025-10-27 11:51:19','2025-10-27 11:51:19'),(19,20,'service',4,'2025-10-27 11:52:09','2025-10-27 11:52:09'),(20,64,'department',45,'2025-10-27 11:52:53','2025-10-27 11:52:53'),(21,1,'service',1,'2025-10-27 11:53:47','2025-10-27 11:53:47'),(22,18,'department',52,'2025-10-27 11:54:35','2025-10-27 11:54:35'),(23,38,'service',9,'2025-10-27 11:55:46','2025-10-27 11:55:46'),(24,52,'service',1,'2025-10-27 11:56:21','2025-10-27 11:56:21'),(25,53,'service',5,'2025-10-27 11:57:06','2025-10-27 11:57:06'),(26,69,'department',50,'2025-10-27 11:58:32','2025-10-27 11:58:32'),(27,58,'service',3,'2025-10-27 11:59:03','2025-10-27 11:59:03'),(28,32,'department',56,'2025-10-27 12:00:04','2025-10-27 12:00:04'),(29,3,'service',3,'2025-10-27 12:00:23','2025-10-27 12:00:23'),(30,59,'service',1,'2025-10-27 12:01:16','2025-10-27 12:01:16'),(31,4,'service',1,'2025-10-27 12:01:44','2025-10-27 12:01:44'),(32,39,'service',6,'2025-10-27 12:02:17','2025-10-27 12:02:17'),(33,42,'department',51,'2025-10-27 12:02:41','2025-10-27 12:02:41'),(34,17,'department',51,'2025-10-27 12:03:25','2025-10-27 12:03:25'),(35,40,'department',45,'2025-10-27 12:03:48','2025-10-27 12:03:48'),(36,21,'service',1,'2025-10-27 12:04:05','2025-10-27 12:04:05'),(37,22,'service',1,'2025-10-27 12:04:47','2025-10-27 12:04:47'),(38,54,'service',2,'2025-10-27 12:05:16','2025-10-27 12:05:16'),(39,27,'service',8,'2025-10-27 12:05:58','2025-10-27 12:05:58'),(41,50,'service',3,'2025-10-27 12:21:17','2025-10-27 12:21:17'),(42,9,'service',2,'2025-10-27 13:39:01','2025-10-27 13:39:01'),(45,43,'department',51,'2025-10-27 14:02:17','2025-10-27 14:02:17'),(46,2,'department',51,'2025-10-27 14:03:30','2025-10-27 14:03:30'),(47,79,'department',51,'2025-10-27 14:08:11','2025-10-27 14:08:11'),(50,74,'service',5,'2025-10-27 14:10:33','2025-10-27 14:10:33'),(51,23,'department',56,'2025-10-27 14:15:02','2025-10-27 14:15:02'),(54,28,'department',34,'2025-10-27 14:22:15','2025-10-27 14:22:15'),(55,55,'department',51,'2025-10-27 15:40:36','2025-10-27 15:40:36'),(56,78,'service',4,'2025-10-27 15:47:39','2025-10-27 15:47:39'),(58,36,'department',50,'2025-10-27 16:22:46','2025-10-27 16:22:46'),(59,82,'service',1,'2025-10-27 16:24:35','2025-10-27 16:24:35'),(60,83,'department',50,'2025-10-27 16:27:32','2025-10-27 16:27:32');
/*!40000 ALTER TABLE `staff_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_contracted_hours`
--

DROP TABLE IF EXISTS `staff_contracted_hours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_contracted_hours` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `day_of_week` tinyint NOT NULL COMMENT '1=Monday, 2=Tuesday, ..., 7=Sunday (ISO 8601)',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL COMMENT 'Can be <= start_time for shifts crossing midnight',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_staff_day_time` (`staff_id`,`day_of_week`,`start_time`,`end_time`),
  KEY `idx_staff_lookup` (`staff_id`),
  KEY `idx_day_lookup` (`day_of_week`),
  KEY `idx_staff_day` (`staff_id`,`day_of_week`),
  CONSTRAINT `staff_contracted_hours_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`id`) ON DELETE CASCADE,
  CONSTRAINT `staff_contracted_hours_chk_1` CHECK ((`day_of_week` between 1 and 7))
) ENGINE=InnoDB AUTO_INCREMENT=172 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_contracted_hours`
--

LOCK TABLES `staff_contracted_hours` WRITE;
/*!40000 ALTER TABLE `staff_contracted_hours` DISABLE KEYS */;
INSERT INTO `staff_contracted_hours` VALUES (6,7,1,'09:00:00','17:00:00','2025-10-26 19:30:36','2025-10-26 19:30:36'),(7,7,2,'09:00:00','17:00:00','2025-10-26 19:30:36','2025-10-26 19:30:36'),(8,7,3,'09:00:00','17:00:00','2025-10-26 19:30:36','2025-10-26 19:30:36'),(9,25,1,'06:00:00','14:00:00','2025-10-27 11:44:59','2025-10-27 11:44:59'),(10,25,2,'06:00:00','14:00:00','2025-10-27 11:44:59','2025-10-27 11:44:59'),(11,25,3,'06:00:00','14:00:00','2025-10-27 11:44:59','2025-10-27 11:44:59'),(12,51,1,'08:00:00','17:00:00','2025-10-27 11:49:13','2025-10-27 11:49:13'),(13,51,2,'08:00:00','17:00:00','2025-10-27 11:49:13','2025-10-27 11:49:13'),(14,51,3,'08:00:00','17:00:00','2025-10-27 11:49:13','2025-10-27 11:49:13'),(15,51,4,'08:00:00','17:00:00','2025-10-27 11:49:13','2025-10-27 11:49:13'),(16,51,5,'08:00:00','17:00:00','2025-10-27 11:49:13','2025-10-27 11:49:13'),(17,49,1,'07:00:00','15:00:00','2025-10-27 11:51:09','2025-10-27 11:51:09'),(18,49,2,'07:00:00','15:00:00','2025-10-27 11:51:09','2025-10-27 11:51:09'),(19,49,3,'07:00:00','15:00:00','2025-10-27 11:51:09','2025-10-27 11:51:09'),(20,49,4,'07:00:00','15:00:00','2025-10-27 11:51:09','2025-10-27 11:51:09'),(21,49,5,'07:00:00','15:00:00','2025-10-27 11:51:09','2025-10-27 11:51:09'),(22,20,1,'08:00:00','16:00:00','2025-10-27 11:52:09','2025-10-27 11:52:09'),(23,20,2,'08:00:00','16:00:00','2025-10-27 11:52:09','2025-10-27 11:52:09'),(24,20,3,'08:00:00','16:00:00','2025-10-27 11:52:09','2025-10-27 11:52:09'),(25,20,4,'08:00:00','16:00:00','2025-10-27 11:52:09','2025-10-27 11:52:09'),(26,20,5,'08:00:00','16:00:00','2025-10-27 11:52:09','2025-10-27 11:52:09'),(27,64,1,'08:00:00','17:00:00','2025-10-27 11:52:53','2025-10-27 11:52:53'),(28,64,2,'08:00:00','17:00:00','2025-10-27 11:52:53','2025-10-27 11:52:53'),(29,64,3,'08:00:00','17:00:00','2025-10-27 11:52:53','2025-10-27 11:52:53'),(30,64,4,'08:00:00','17:00:00','2025-10-27 11:52:53','2025-10-27 11:52:53'),(31,64,5,'08:00:00','17:00:00','2025-10-27 11:52:53','2025-10-27 11:52:53'),(32,18,1,'08:00:00','17:00:00','2025-10-27 11:54:35','2025-10-27 11:54:35'),(33,18,2,'08:00:00','17:00:00','2025-10-27 11:54:35','2025-10-27 11:54:35'),(34,18,3,'08:00:00','17:00:00','2025-10-27 11:54:35','2025-10-27 11:54:35'),(35,18,4,'08:00:00','17:00:00','2025-10-27 11:54:35','2025-10-27 11:54:35'),(36,18,5,'08:00:00','17:00:00','2025-10-27 11:54:35','2025-10-27 11:54:35'),(37,38,1,'08:00:00','17:00:00','2025-10-27 11:55:46','2025-10-27 11:55:46'),(38,38,2,'08:00:00','17:00:00','2025-10-27 11:55:46','2025-10-27 11:55:46'),(39,38,3,'08:00:00','17:00:00','2025-10-27 11:55:46','2025-10-27 11:55:46'),(40,38,4,'08:00:00','17:00:00','2025-10-27 11:55:46','2025-10-27 11:55:46'),(41,38,5,'08:00:00','17:00:00','2025-10-27 11:55:46','2025-10-27 11:55:46'),(42,53,1,'08:00:00','17:00:00','2025-10-27 11:57:06','2025-10-27 11:57:06'),(43,53,2,'08:00:00','17:00:00','2025-10-27 11:57:06','2025-10-27 11:57:06'),(44,53,3,'08:00:00','17:00:00','2025-10-27 11:57:06','2025-10-27 11:57:06'),(45,53,4,'08:00:00','17:00:00','2025-10-27 11:57:06','2025-10-27 11:57:06'),(46,53,5,'08:00:00','17:00:00','2025-10-27 11:57:06','2025-10-27 11:57:06'),(47,69,1,'06:00:00','14:00:00','2025-10-27 11:58:32','2025-10-27 11:58:32'),(48,69,2,'06:00:00','14:00:00','2025-10-27 11:58:32','2025-10-27 11:58:32'),(49,69,3,'06:00:00','14:00:00','2025-10-27 11:58:32','2025-10-27 11:58:32'),(50,69,4,'06:00:00','14:00:00','2025-10-27 11:58:32','2025-10-27 11:58:32'),(51,69,5,'06:00:00','14:00:00','2025-10-27 11:58:32','2025-10-27 11:58:32'),(52,58,1,'08:00:00','17:00:00','2025-10-27 11:59:03','2025-10-27 11:59:03'),(53,58,2,'08:00:00','17:00:00','2025-10-27 11:59:03','2025-10-27 11:59:03'),(54,58,3,'08:00:00','17:00:00','2025-10-27 11:59:03','2025-10-27 11:59:03'),(55,58,4,'08:00:00','17:00:00','2025-10-27 11:59:03','2025-10-27 11:59:03'),(56,58,5,'08:00:00','17:00:00','2025-10-27 11:59:03','2025-10-27 11:59:03'),(57,32,1,'14:00:00','22:00:00','2025-10-27 12:00:04','2025-10-27 12:00:04'),(58,32,2,'14:00:00','22:00:00','2025-10-27 12:00:04','2025-10-27 12:00:04'),(59,32,3,'14:00:00','22:00:00','2025-10-27 12:00:04','2025-10-27 12:00:04'),(60,32,4,'14:00:00','22:00:00','2025-10-27 12:00:04','2025-10-27 12:00:04'),(61,32,5,'14:00:00','22:00:00','2025-10-27 12:00:04','2025-10-27 12:00:04'),(62,3,1,'08:00:00','16:00:00','2025-10-27 12:00:23','2025-10-27 12:00:23'),(63,3,2,'08:00:00','16:00:00','2025-10-27 12:00:23','2025-10-27 12:00:23'),(64,3,3,'08:00:00','16:00:00','2025-10-27 12:00:23','2025-10-27 12:00:23'),(65,3,4,'08:00:00','16:00:00','2025-10-27 12:00:23','2025-10-27 12:00:23'),(66,59,1,'12:00:00','20:00:00','2025-10-27 12:01:16','2025-10-27 12:01:16'),(67,59,2,'12:00:00','20:00:00','2025-10-27 12:01:16','2025-10-27 12:01:16'),(68,59,3,'12:00:00','20:00:00','2025-10-27 12:01:16','2025-10-27 12:01:16'),(69,59,4,'12:00:00','20:00:00','2025-10-27 12:01:16','2025-10-27 12:01:16'),(70,59,5,'12:00:00','20:00:00','2025-10-27 12:01:16','2025-10-27 12:01:16'),(71,39,1,'08:00:00','17:00:00','2025-10-27 12:02:17','2025-10-27 12:02:17'),(72,39,2,'08:00:00','17:00:00','2025-10-27 12:02:17','2025-10-27 12:02:17'),(73,39,3,'08:00:00','17:00:00','2025-10-27 12:02:17','2025-10-27 12:02:17'),(74,39,4,'08:00:00','17:00:00','2025-10-27 12:02:17','2025-10-27 12:02:17'),(75,39,5,'08:00:00','17:00:00','2025-10-27 12:02:17','2025-10-27 12:02:17'),(76,17,6,'08:00:00','17:00:00','2025-10-27 12:03:25','2025-10-27 12:03:25'),(77,17,7,'08:00:00','17:00:00','2025-10-27 12:03:25','2025-10-27 12:03:25'),(78,40,1,'08:00:00','17:00:00','2025-10-27 12:03:48','2025-10-27 12:03:48'),(79,40,2,'08:00:00','17:00:00','2025-10-27 12:03:48','2025-10-27 12:03:48'),(80,40,3,'08:00:00','17:00:00','2025-10-27 12:03:48','2025-10-27 12:03:48'),(81,40,4,'08:00:00','17:00:00','2025-10-27 12:03:48','2025-10-27 12:03:48'),(82,40,5,'08:00:00','17:00:00','2025-10-27 12:03:48','2025-10-27 12:03:48'),(83,54,1,'08:00:00','17:00:00','2025-10-27 12:05:16','2025-10-27 12:05:16'),(84,54,2,'08:00:00','17:00:00','2025-10-27 12:05:16','2025-10-27 12:05:16'),(85,54,3,'08:00:00','17:00:00','2025-10-27 12:05:16','2025-10-27 12:05:16'),(86,54,4,'08:00:00','17:00:00','2025-10-27 12:05:16','2025-10-27 12:05:16'),(87,54,5,'08:00:00','17:00:00','2025-10-27 12:05:16','2025-10-27 12:05:16'),(88,27,1,'08:00:00','17:00:00','2025-10-27 12:05:58','2025-10-27 12:05:58'),(89,27,2,'08:00:00','17:00:00','2025-10-27 12:05:58','2025-10-27 12:05:58'),(90,27,3,'08:00:00','17:00:00','2025-10-27 12:05:58','2025-10-27 12:05:58'),(91,27,4,'08:00:00','17:00:00','2025-10-27 12:05:58','2025-10-27 12:05:58'),(92,27,5,'08:00:00','17:00:00','2025-10-27 12:05:58','2025-10-27 12:05:58'),(93,50,1,'08:00:00','17:00:00','2025-10-27 12:21:17','2025-10-27 12:21:17'),(94,50,2,'08:00:00','17:00:00','2025-10-27 12:21:17','2025-10-27 12:21:17'),(95,50,3,'08:00:00','17:00:00','2025-10-27 12:21:17','2025-10-27 12:21:17'),(96,50,4,'08:00:00','17:00:00','2025-10-27 12:21:17','2025-10-27 12:21:17'),(97,50,5,'08:00:00','17:00:00','2025-10-27 12:21:17','2025-10-27 12:21:17'),(98,9,1,'08:00:00','17:00:00','2025-10-27 13:39:01','2025-10-27 13:39:01'),(99,9,2,'08:00:00','17:00:00','2025-10-27 13:39:01','2025-10-27 13:39:01'),(100,9,3,'08:00:00','17:00:00','2025-10-27 13:39:01','2025-10-27 13:39:01'),(101,9,4,'08:00:00','17:00:00','2025-10-27 13:39:01','2025-10-27 13:39:01'),(102,9,5,'08:00:00','17:00:00','2025-10-27 13:39:01','2025-10-27 13:39:01'),(103,79,1,'08:00:00','17:00:00','2025-10-27 14:08:11','2025-10-27 14:08:11'),(104,79,2,'08:00:00','17:00:00','2025-10-27 14:08:11','2025-10-27 14:08:11'),(105,79,3,'08:00:00','17:00:00','2025-10-27 14:08:11','2025-10-27 14:08:11'),(106,79,4,'08:00:00','17:00:00','2025-10-27 14:08:11','2025-10-27 14:08:11'),(107,79,5,'08:00:00','17:00:00','2025-10-27 14:08:11','2025-10-27 14:08:11'),(117,74,1,'08:00:00','17:00:00','2025-10-27 14:10:33','2025-10-27 14:10:33'),(118,74,2,'08:00:00','17:00:00','2025-10-27 14:10:33','2025-10-27 14:10:33'),(119,74,3,'08:00:00','17:00:00','2025-10-27 14:10:33','2025-10-27 14:10:33'),(120,74,4,'08:00:00','17:00:00','2025-10-27 14:10:33','2025-10-27 14:10:33'),(121,74,5,'08:00:00','17:00:00','2025-10-27 14:10:33','2025-10-27 14:10:33'),(122,23,1,'08:00:00','17:00:00','2025-10-27 14:15:02','2025-10-27 14:15:02'),(123,23,2,'08:00:00','17:00:00','2025-10-27 14:15:02','2025-10-27 14:15:02'),(124,23,3,'08:00:00','17:00:00','2025-10-27 14:15:02','2025-10-27 14:15:02'),(125,23,4,'08:00:00','17:00:00','2025-10-27 14:15:02','2025-10-27 14:15:02'),(126,23,5,'08:00:00','17:00:00','2025-10-27 14:15:02','2025-10-27 14:15:02'),(139,28,1,'11:00:00','19:00:00','2025-10-27 14:22:15','2025-10-27 14:22:15'),(140,28,2,'11:00:00','19:00:00','2025-10-27 14:22:15','2025-10-27 14:22:15'),(141,28,4,'11:00:00','19:00:00','2025-10-27 14:22:15','2025-10-27 14:22:15'),(142,28,5,'11:00:00','19:00:00','2025-10-27 14:22:15','2025-10-27 14:22:15'),(143,55,1,'08:00:00','17:00:00','2025-10-27 15:40:36','2025-10-27 15:40:36'),(144,55,2,'08:00:00','17:00:00','2025-10-27 15:40:36','2025-10-27 15:40:36'),(145,55,3,'08:00:00','17:00:00','2025-10-27 15:40:36','2025-10-27 15:40:36'),(146,55,4,'08:00:00','17:00:00','2025-10-27 15:40:36','2025-10-27 15:40:36'),(147,55,5,'08:00:00','17:00:00','2025-10-27 15:40:36','2025-10-27 15:40:36'),(148,78,1,'08:00:00','16:00:00','2025-10-27 15:47:39','2025-10-27 15:47:39'),(149,78,2,'08:00:00','16:00:00','2025-10-27 15:47:39','2025-10-27 15:47:39'),(150,78,3,'08:00:00','16:00:00','2025-10-27 15:47:39','2025-10-27 15:47:39'),(151,78,4,'08:00:00','16:00:00','2025-10-27 15:47:39','2025-10-27 15:47:39'),(152,78,5,'08:00:00','16:00:00','2025-10-27 15:47:39','2025-10-27 15:47:39'),(153,36,1,'09:00:00','17:00:00','2025-10-27 16:22:46','2025-10-27 16:22:46'),(154,36,2,'09:00:00','17:00:00','2025-10-27 16:22:46','2025-10-27 16:22:46'),(155,36,3,'09:00:00','17:00:00','2025-10-27 16:22:46','2025-10-27 16:22:46'),(156,36,4,'09:00:00','17:00:00','2025-10-27 16:22:46','2025-10-27 16:22:46'),(157,36,5,'09:00:00','17:00:00','2025-10-27 16:22:46','2025-10-27 16:22:46'),(158,41,3,'06:00:00','14:00:00','2025-10-27 16:24:04','2025-10-27 16:24:04'),(159,41,4,'06:00:00','14:00:00','2025-10-27 16:24:04','2025-10-27 16:24:04'),(160,41,5,'06:00:00','14:00:00','2025-10-27 16:24:04','2025-10-27 16:24:04'),(161,41,6,'06:00:00','14:00:00','2025-10-27 16:24:04','2025-10-27 16:24:04'),(162,41,7,'06:00:00','14:00:00','2025-10-27 16:24:04','2025-10-27 16:24:04'),(163,82,1,'12:00:00','20:00:00','2025-10-27 16:24:35','2025-10-27 16:24:35'),(164,82,2,'12:00:00','20:00:00','2025-10-27 16:24:35','2025-10-27 16:24:35'),(165,82,3,'12:00:00','20:00:00','2025-10-27 16:24:35','2025-10-27 16:24:35'),(166,82,4,'12:00:00','20:00:00','2025-10-27 16:24:35','2025-10-27 16:24:35'),(167,82,5,'12:00:00','20:00:00','2025-10-27 16:24:35','2025-10-27 16:24:35'),(168,83,1,'13:00:00','01:00:00','2025-10-27 16:27:32','2025-10-27 16:27:32'),(169,83,2,'13:00:00','01:00:00','2025-10-27 16:27:32','2025-10-27 16:27:32'),(170,83,4,'13:00:00','01:00:00','2025-10-27 16:27:32','2025-10-27 16:27:32'),(171,83,5,'13:00:00','01:00:00','2025-10-27 16:27:32','2025-10-27 16:27:32');
/*!40000 ALTER TABLE `staff_contracted_hours` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-28  9:35:55
