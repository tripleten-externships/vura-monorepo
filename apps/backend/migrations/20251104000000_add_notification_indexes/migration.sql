-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT '',
    `notificationType` VARCHAR(191) NOT NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'MEDIUM',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `actionUrl` VARCHAR(191) NOT NULL DEFAULT '',
    `metadata` JSON NULL DEFAULT ('{}'),
    `read` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `scheduledFor` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user` VARCHAR(191) NULL,
    `relatedCarePlan` VARCHAR(191) NULL,
    `relatedChat` VARCHAR(191) NULL,
    `relatedForumPost` VARCHAR(191) NULL,

    INDEX `Notification_user_idx`(`user`),
    INDEX `Notification_notificationType_idx`(`notificationType`),
    INDEX `Notification_read_idx`(`read`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    INDEX `Notification_scheduledFor_idx`(`scheduledFor`),
    INDEX `Notification_relatedCarePlan_idx`(`relatedCarePlan`),
    INDEX `Notification_relatedChat_idx`(`relatedChat`),
    INDEX `Notification_relatedForumPost_idx`(`relatedForumPost`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_user_fkey` FOREIGN KEY (`user`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_relatedCarePlan_fkey` FOREIGN KEY (`relatedCarePlan`) REFERENCES `CarePlan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_relatedChat_fkey` FOREIGN KEY (`relatedChat`) REFERENCES `GroupChat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_relatedForumPost_fkey` FOREIGN KEY (`relatedForumPost`) REFERENCES `ForumPost`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

