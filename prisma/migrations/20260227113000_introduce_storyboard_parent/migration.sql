-- CreateTable
CREATE TABLE `Storyboard` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `episodeId` INTEGER NOT NULL,
    `boardNumber` INTEGER NOT NULL,
    `title` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Storyboard_episodeId_boardNumber_key`(`episodeId`, `boardNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `Shot`
    ADD COLUMN `storyboardId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Shot_storyboardId_idx` ON `Shot`(`storyboardId`);

-- Backfill: create one storyboard for each existing shot
INSERT INTO `Storyboard` (`episodeId`, `boardNumber`, `title`, `description`, `createdAt`, `updatedAt`)
SELECT
    s.`episodeId`,
    s.`shotNumber`,
    NULL,
    s.`shotDescription`,
    s.`createdAt`,
    s.`updatedAt`
FROM `Shot` s;

-- Backfill: link shot to the storyboard created from it
UPDATE `Shot` s
INNER JOIN `Storyboard` sb
    ON sb.`episodeId` = s.`episodeId`
   AND sb.`boardNumber` = s.`shotNumber`
SET s.`storyboardId` = sb.`id`
WHERE s.`storyboardId` IS NULL;

-- AddForeignKey
ALTER TABLE `Storyboard`
    ADD CONSTRAINT `Storyboard_episodeId_fkey`
    FOREIGN KEY (`episodeId`) REFERENCES `Episode`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shot`
    ADD CONSTRAINT `Shot_storyboardId_fkey`
    FOREIGN KEY (`storyboardId`) REFERENCES `Storyboard`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
