-- CreateTable
CREATE TABLE `NotificationCounter` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `notificationType` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
-- Composite unique index for fast lookups and prevents duplicates
CREATE UNIQUE INDEX `NotificationCounter_userId_notificationType_key` ON `NotificationCounter`(`userId`, `notificationType`);

-- CreateIndex
-- Index for user-based queries
CREATE INDEX `NotificationCounter_userId_idx` ON `NotificationCounter`(`userId`);

-- CreateIndex
-- Covering index for count queries (includes all fields needed)
CREATE INDEX `NotificationCounter_userId_notificationType_count_idx` ON `NotificationCounter`(`userId`, `notificationType`, `count`);

