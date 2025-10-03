/*
  Warnings:

  - You are about to drop the column `created_at` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `health_conditions` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `Parent` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `CarePlan` DROP FOREIGN KEY `CarePlan_user_fkey`;

-- DropIndex
DROP INDEX `CarePlan_user_key` ON `CarePlan`;

-- AlterTable
ALTER TABLE `Parent` DROP COLUMN `created_at`,
    DROP COLUMN `health_conditions`,
    DROP COLUMN `updated_at`,
    ADD COLUMN `createdAt` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `healthConditions` JSON NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `age` INTEGER NULL,
    MODIFY `gender` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `CarePlan_user_idx` ON `CarePlan`(`user`);

-- AddForeignKey
ALTER TABLE `CarePlan` ADD CONSTRAINT `CarePlan_user_fkey` FOREIGN KEY (`user`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
