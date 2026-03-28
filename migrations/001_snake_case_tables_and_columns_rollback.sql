-- Rollback 001: Restore original table names and camelCase columns
--
-- Usage: mariadb -u <user> -p sakariheitaja < migrations/001_snake_case_tables_and_columns_rollback.sql

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- Step 1: Rename tables back to original names
-- ============================================================

RENAME TABLE
  `aces`                  TO `Aces`,
  `albatrosses`           TO `Albatrosses`,
  `chats`                 TO `Chats`,
  `competitions`          TO `Competitions`,
  `courses`               TO `Courses`,
  `daily_throws`          TO `DailyThrows`,
  `daily_throws_to_player` TO `DailyThrowsToPlayer`,
  `eagles`                TO `Eagles`,
  `player_to_chat`        TO `PlayerToChat`,
  `players`               TO `Players`,
  `scores`                TO `Scores`;

-- ============================================================
-- Step 2: Restore camelCase columns
-- ============================================================

-- Competitions
ALTER TABLE `Competitions`
  DROP FOREIGN KEY `fk_competitions_chat_id`,
  DROP KEY `chat_id`;

ALTER TABLE `Competitions`
  RENAME COLUMN `chat_id` TO `chatId`,
  RENAME COLUMN `metrix_id` TO `metrixId`;

ALTER TABLE `Competitions`
  ADD KEY `chatId` (`chatId`),
  ADD CONSTRAINT `chatId`
    FOREIGN KEY (`chatId`) REFERENCES `Chats` (`id`) ON DELETE CASCADE;

-- Courses
ALTER TABLE `Courses`
  RENAME COLUMN `nick_name` TO `nickName`;

-- DailyThrowsToPlayer
ALTER TABLE `DailyThrowsToPlayer`
  DROP FOREIGN KEY `fk_dttp_daily_throws_id`,
  DROP FOREIGN KEY `fk_dttp_player_id`,
  DROP KEY `daily_throws_id`,
  DROP KEY `player_id`;

ALTER TABLE `DailyThrowsToPlayer`
  RENAME COLUMN `daily_throws_id` TO `dailyThrowsId`,
  RENAME COLUMN `player_id` TO `playerId`;

ALTER TABLE `DailyThrowsToPlayer`
  ADD KEY `dailyThrowsId` (`dailyThrowsId`),
  ADD KEY `playerId` (`playerId`),
  ADD CONSTRAINT `dailyThrowsId`
    FOREIGN KEY (`dailyThrowsId`) REFERENCES `DailyThrows` (`id`),
  ADD CONSTRAINT `playerId`
    FOREIGN KEY (`playerId`) REFERENCES `Players` (`id`);

SET FOREIGN_KEY_CHECKS = 1;
