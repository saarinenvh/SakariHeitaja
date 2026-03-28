-- Migration 001: Rename all tables to snake_case, fix camelCase columns
-- MariaDB 10.5+ (uses RENAME COLUMN syntax)
--
-- Run on dev first, verify, then run on prod.
-- Safe to run: no data is modified, only names change.
--
-- Usage: mariadb -u <user> -p sakariheitaja < migrations/001_snake_case_tables_and_columns.sql

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- Step 1: Fix camelCase columns (while tables still have old names)
-- ============================================================

-- Competitions: chatId → chat_id, metrixId → metrix_id
-- The FK constraint named 'chatId' must be dropped and recreated
ALTER TABLE `Competitions`
  DROP FOREIGN KEY `chatId`,
  DROP KEY `chatId`;

ALTER TABLE `Competitions`
  RENAME COLUMN `chatId` TO `chat_id`,
  RENAME COLUMN `metrixId` TO `metrix_id`;

ALTER TABLE `Competitions`
  ADD KEY `chat_id` (`chat_id`),
  ADD CONSTRAINT `fk_competitions_chat_id`
    FOREIGN KEY (`chat_id`) REFERENCES `Chats` (`id`) ON DELETE CASCADE;

-- Courses: nickName → nick_name
ALTER TABLE `Courses`
  RENAME COLUMN `nickName` TO `nick_name`;

-- DailyThrowsToPlayer: dailyThrowsId → daily_throws_id, playerId → player_id
ALTER TABLE `DailyThrowsToPlayer`
  DROP FOREIGN KEY `dailyThrowsId`,
  DROP FOREIGN KEY `playerId`,
  DROP KEY `dailyThrowsId`,
  DROP KEY `playerId`;

ALTER TABLE `DailyThrowsToPlayer`
  RENAME COLUMN `dailyThrowsId` TO `daily_throws_id`,
  RENAME COLUMN `playerId` TO `player_id`;

ALTER TABLE `DailyThrowsToPlayer`
  ADD KEY `daily_throws_id` (`daily_throws_id`),
  ADD KEY `player_id` (`player_id`),
  ADD CONSTRAINT `fk_dttp_daily_throws_id`
    FOREIGN KEY (`daily_throws_id`) REFERENCES `DailyThrows` (`id`),
  ADD CONSTRAINT `fk_dttp_player_id`
    FOREIGN KEY (`player_id`) REFERENCES `Players` (`id`);

-- ============================================================
-- Step 2: Rename all tables to snake_case
-- MariaDB automatically updates FK references on RENAME TABLE
-- ============================================================

RENAME TABLE
  `Aces`                TO `aces`,
  `Albatrosses`         TO `albatrosses`,
  `Chats`               TO `chats`,
  `Competitions`        TO `competitions`,
  `Courses`             TO `courses`,
  `DailyThrows`         TO `daily_throws`,
  `DailyThrowsToPlayer` TO `daily_throws_to_player`,
  `Eagles`              TO `eagles`,
  `PlayerToChat`        TO `player_to_chat`,
  `Players`             TO `players`,
  `Scores`              TO `scores`;

SET FOREIGN_KEY_CHECKS = 1;

-- Verify: run this after migration to check all tables are renamed
-- SHOW TABLES;
