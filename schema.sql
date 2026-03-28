/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: sakariheitaja
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0ubuntu0.24.04.1

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
-- Table structure for table `Aces`
--

DROP TABLE IF EXISTS `Aces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Aces` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `player_id` int(11) NOT NULL,
  `chat_id` bigint(20) NOT NULL,
  `course_id` int(11) NOT NULL,
  `competition_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_aces_player_id` (`player_id`),
  KEY `fk_aces_chat_id` (`chat_id`),
  KEY `fk_aces_course_id` (`course_id`),
  KEY `fk_aces_competition_id` (`competition_id`),
  CONSTRAINT `fk_aces_chat_id` FOREIGN KEY (`chat_id`) REFERENCES `Chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_aces_competition_id` FOREIGN KEY (`competition_id`) REFERENCES `Competitions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_aces_course_id` FOREIGN KEY (`course_id`) REFERENCES `Courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_aces_player_id` FOREIGN KEY (`player_id`) REFERENCES `Players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Albatrosses`
--

DROP TABLE IF EXISTS `Albatrosses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Albatrosses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `player_id` int(11) NOT NULL,
  `chat_id` bigint(20) NOT NULL,
  `course_id` int(11) NOT NULL,
  `competition_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_albatrosses_player_id` (`player_id`),
  KEY `fk_albatrosses_chat_id` (`chat_id`),
  KEY `fk_albatrosses_course_id` (`course_id`),
  KEY `fk_albatrosses_competition_id` (`competition_id`),
  CONSTRAINT `fk_albatrosses_chat_id` FOREIGN KEY (`chat_id`) REFERENCES `Chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_albatrosses_competition_id` FOREIGN KEY (`competition_id`) REFERENCES `Competitions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_albatrosses_course_id` FOREIGN KEY (`course_id`) REFERENCES `Courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_albatrosses_player_id` FOREIGN KEY (`player_id`) REFERENCES `Players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Chats`
--

DROP TABLE IF EXISTS `Chats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Chats` (
  `id` bigint(20) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Competitions`
--

DROP TABLE IF EXISTS `Competitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Competitions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `finished` tinyint(1) DEFAULT NULL,
  `chatId` bigint(20) DEFAULT NULL,
  `metrixId` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `chatId` (`chatId`),
  CONSTRAINT `chatId` FOREIGN KEY (`chatId`) REFERENCES `Chats` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3082 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Courses`
--

DROP TABLE IF EXISTS `Courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `nickName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=419 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `DailyThrows`
--

DROP TABLE IF EXISTS `DailyThrows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `DailyThrows` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `DailyThrowsToPlayer`
--

DROP TABLE IF EXISTS `DailyThrowsToPlayer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `DailyThrowsToPlayer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dailyThrowsId` int(11) NOT NULL,
  `playerId` int(11) NOT NULL,
  `message` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dailyThrowsId` (`dailyThrowsId`),
  KEY `playerId` (`playerId`),
  CONSTRAINT `dailyThrowsId` FOREIGN KEY (`dailyThrowsId`) REFERENCES `DailyThrows` (`id`),
  CONSTRAINT `playerId` FOREIGN KEY (`playerId`) REFERENCES `Players` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Eagles`
--

DROP TABLE IF EXISTS `Eagles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Eagles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `player_id` int(11) NOT NULL,
  `chat_id` bigint(20) NOT NULL,
  `course_id` int(11) NOT NULL,
  `competition_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_eagles_player_id` (`player_id`),
  KEY `fk_eagles_chat_id` (`chat_id`),
  KEY `fk_eagles_course_id` (`course_id`),
  KEY `fk_eagles_competition_id` (`competition_id`),
  CONSTRAINT `fk_eagles_chat_id` FOREIGN KEY (`chat_id`) REFERENCES `Chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eagles_competition_id` FOREIGN KEY (`competition_id`) REFERENCES `Competitions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eagles_course_id` FOREIGN KEY (`course_id`) REFERENCES `Courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_eagles_player_id` FOREIGN KEY (`player_id`) REFERENCES `Players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `PlayerToChat`
--

DROP TABLE IF EXISTS `PlayerToChat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `PlayerToChat` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` int(11) NOT NULL,
  `chat_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `player_id` (`player_id`),
  KEY `chat_id` (`chat_id`),
  CONSTRAINT `chat_id` FOREIGN KEY (`chat_id`) REFERENCES `Chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `player_id` FOREIGN KEY (`player_id`) REFERENCES `Players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=157 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Players`
--

DROP TABLE IF EXISTS `Players`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Players` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Scores`
--

DROP TABLE IF EXISTS `Scores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Scores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` int(11) NOT NULL,
  `chat_id` bigint(20) NOT NULL,
  `course_id` int(11) NOT NULL,
  `competition_id` int(11) NOT NULL,
  `diff` int(11) NOT NULL,
  `sum` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_scores_player_id` (`player_id`),
  KEY `fk_scores_chat_id` (`chat_id`),
  KEY `fk_scores_course_id` (`course_id`),
  KEY `fk_scores_competition_id` (`competition_id`),
  CONSTRAINT `fk_scores_chat_id` FOREIGN KEY (`chat_id`) REFERENCES `Chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_scores_competition_id` FOREIGN KEY (`competition_id`) REFERENCES `Competitions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_scores_course_id` FOREIGN KEY (`course_id`) REFERENCES `Courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_scores_player_id` FOREIGN KEY (`player_id`) REFERENCES `Players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7523 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping routines for database 'sakariheitaja'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-28 19:32:59
