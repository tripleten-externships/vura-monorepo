-- CreateTable
CREATE TABLE `Checklist` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resource` (
    `id` VARCHAR(191) NOT NULL,
    `link` VARCHAR(191) NOT NULL DEFAULT '',
    `content` VARCHAR(191) NOT NULL DEFAULT '',
    `checklist` VARCHAR(191) NULL,

    INDEX `Resource_checklist_idx`(`checklist`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Resource` ADD CONSTRAINT `Resource_checklist_fkey` FOREIGN KEY (`checklist`) REFERENCES `Checklist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
