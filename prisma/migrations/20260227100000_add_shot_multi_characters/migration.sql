-- AlterTable
ALTER TABLE `Shot`
    ADD COLUMN `cameraMovement` VARCHAR(100) NULL,
    ADD COLUMN `dialogueText` TEXT NULL,
    ADD COLUMN `characterIds` JSON NULL;

-- Backfill existing single character into multi-character list
UPDATE `Shot`
SET `characterIds` = JSON_ARRAY(`characterId`)
WHERE `characterId` IS NOT NULL
  AND (`characterIds` IS NULL OR JSON_LENGTH(`characterIds`) = 0);
