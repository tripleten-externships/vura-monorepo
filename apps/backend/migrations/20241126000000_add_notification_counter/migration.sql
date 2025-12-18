-- CreateTable

CREATE TABLE `NotificationCounter` (
    `id` VARCHAR(191) NOT NULL DEFAULT (UUID()),
    `user` VARCHAR(191) NOT NULL,
    `notificationType` ENUM('CARE_PLAN', 'CHAT', 'FORUM', 'SYSTEM') NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `lastUpdated` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`),
    UNIQUE INDEX `NotificationCounter_user_notificationType_key`(`user`, `notificationType`),
    INDEX `NotificationCounter_user_idx`(`user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NotificationCounter` ADD CONSTRAINT `NotificationCounter_user_fkey` FOREIGN KEY (`user`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

