-- CreateTable
CREATE TABLE `AiChatSession` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL DEFAULT '',
    `status` ENUM('active', 'paused', 'completed', 'archived') NOT NULL DEFAULT 'active',
    `metadata` JSON NULL DEFAULT ('{}'),
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastActiveAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user` VARCHAR(191) NULL,

    INDEX `AiChatSession_user_idx`(`user`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiMessage` (
    `id` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `author` ENUM('user', 'assistant', 'system', 'tool') NOT NULL,
    `model` VARCHAR(191) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `temperature` DOUBLE NULL,
    `latencyMs` INTEGER NULL,
    `promptTokens` INTEGER NULL,
    `completionTokens` INTEGER NULL,
    `totalTokens` INTEGER NULL,
    `toolName` VARCHAR(191) NOT NULL DEFAULT '',
    `toolArgs` JSON NULL,
    `toolResult` JSON NULL,
    `error` JSON NULL,
    `session` VARCHAR(191) NULL,
    `parentMessage` VARCHAR(191) NULL,

    INDEX `AiMessage_session_idx`(`session`),
    INDEX `AiMessage_parentMessage_idx`(`parentMessage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AiChatSession` ADD CONSTRAINT `AiChatSession_user_fkey` FOREIGN KEY (`user`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiMessage` ADD CONSTRAINT `AiMessage_session_fkey` FOREIGN KEY (`session`) REFERENCES `AiChatSession`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiMessage` ADD CONSTRAINT `AiMessage_parentMessage_fkey` FOREIGN KEY (`parentMessage`) REFERENCES `AiMessage`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
