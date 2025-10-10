/*
  Warnings:

  - You are about to drop the column `name` on the `CarePlan` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[title]` on the table `CarePlan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `CarePlan` DROP COLUMN `name`,
    ADD COLUMN `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `title` VARCHAR(191) NOT NULL DEFAULT '',
    ADD COLUMN `updated_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `User` MODIFY `lastLoginDate` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX `CarePlan_title_key` ON `CarePlan`(`title`);
