-- AlterTable ForumPost: Remove notification-related fields, add updatedAt
ALTER TABLE `ForumPost` DROP COLUMN `type`;
ALTER TABLE `ForumPost` DROP COLUMN `actionUrl`;
ALTER TABLE `ForumPost` DROP COLUMN `read`;
ALTER TABLE `ForumPost` DROP COLUMN `readAt`;
ALTER TABLE `ForumPost` DROP COLUMN `expiresAt`;
ALTER TABLE `ForumPost` DROP COLUMN `scheduledFor`;

-- Add updatedAt with default value
ALTER TABLE `ForumPost` ADD COLUMN `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- Add indexes for better query performance
CREATE INDEX `ForumPost_topic_idx` ON `ForumPost`(`topic`);

-- AlterTable ForumSubscription: Remove content field, add unique constraint
ALTER TABLE `ForumSubscription` DROP COLUMN `content`;

-- Add composite unique index to prevent duplicate subscriptions
CREATE UNIQUE INDEX `ForumSubscription_userId_topic_key` ON `ForumSubscription`(`user`, `topic`);

-- Add topic index for better query performance
CREATE INDEX `ForumSubscription_topic_idx` ON `ForumSubscription`(`topic`);

-- AlterTable Notification: Add composite index for better read query performance
CREATE INDEX `Notification_read_user_idx` ON `Notification`(`read`, `user`);

