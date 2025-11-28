-- CreateTable

CREATE TABLE `FrontendAccount` (
    `id` VARCHAR(191) NOT NULL DEFAULT (UUID()),
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `providerType` ENUM('PASSWORD', 'GOOGLE', 'APPLE') NOT NULL DEFAULT 'PASSWORD',
    `providerAccountId` VARCHAR(191) NULL,
    `isKeystoneUserCreated` BOOLEAN NOT NULL DEFAULT FALSE,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `user` VARCHAR(191) NULL,

    PRIMARY KEY (`id`),
    UNIQUE INDEX `FrontendAccount_email_key`(`email`),
    UNIQUE INDEX `FrontendAccount_providerAccountId_key`(`providerAccountId`),
    UNIQUE INDEX `FrontendAccount_user_key`(`user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FrontendAccount`
  ADD CONSTRAINT `FrontendAccount_user_fkey`
  FOREIGN KEY (`user`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

