-- CreateTable
CREATE TABLE `Project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `coverImage` VARCHAR(500) NULL,
    `totalEpisodes` INTEGER NOT NULL DEFAULT 10,
    `status` ENUM('DRAFT', 'GENERATING', 'COMPLETED') NOT NULL DEFAULT 'DRAFT',
    `settings` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Character` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `avatarPath` VARCHAR(500) NULL,
    `traits` JSON NULL,
    `voiceId` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Scene` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `backgroundPath` VARCHAR(500) NULL,
    `location` VARCHAR(100) NULL,
    `timeOfDay` ENUM('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'DAWN', 'DUSK') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Episode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `episodeNumber` INTEGER NOT NULL,
    `title` VARCHAR(255) NULL,
    `synopsis` TEXT NULL,
    `storyOutline` TEXT NULL,
    `dialogueText` LONGTEXT NULL,
    `status` ENUM('PENDING', 'GENERATING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Episode_projectId_episodeNumber_key`(`projectId`, `episodeNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Shot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `episodeId` INTEGER NOT NULL,
    `shotNumber` INTEGER NOT NULL,
    `shotType` ENUM('EXTREME_WIDE_SHOT', 'WIDE_SHOT', 'FULL_SHOT', 'MEDIUM_WIDE_SHOT', 'MEDIUM_SHOT', 'MEDIUM_CLOSE_UP', 'CLOSE_UP', 'EXTREME_CLOSE_UP', 'POV', 'TWO_SHOT') NOT NULL DEFAULT 'MEDIUM_SHOT',
    `shotDescription` TEXT NULL,
    `videoPrompt` TEXT NULL,
    `characterId` INTEGER NULL,
    `sceneId` INTEGER NULL,
    `characterImage` VARCHAR(500) NULL,
    `sceneImage` VARCHAR(500) NULL,
    `videoPath` VARCHAR(500) NULL,
    `ttsAudioPath` VARCHAR(500) NULL,
    `lipSyncVideo` VARCHAR(500) NULL,
    `duration` DOUBLE NULL DEFAULT 5.0,
    `status` ENUM('PENDING', 'GENERATING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Asset` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `assetType` ENUM('CHARACTER_IMAGE', 'SCENE_IMAGE', 'BACKGROUND', 'AUDIO', 'VIDEO') NOT NULL,
    `filePath` VARCHAR(500) NOT NULL,
    `source` ENUM('GENERATED', 'UPLOADED') NOT NULL DEFAULT 'UPLOADED',
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `taskType` ENUM('GENERATE_OUTLINE', 'GENERATE_CHARACTERS', 'GENERATE_SCENES', 'GENERATE_EPISODE', 'GENERATE_SHOTS', 'GENERATE_TTS', 'GENERATE_VIDEO', 'MERGE_VIDEO') NOT NULL,
    `targetId` INTEGER NULL,
    `targetType` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `inputData` JSON NULL,
    `outputData` JSON NULL,
    `errorMsg` TEXT NULL,
    `progress` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Character` ADD CONSTRAINT `Character_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Scene` ADD CONSTRAINT `Scene_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Episode` ADD CONSTRAINT `Episode_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shot` ADD CONSTRAINT `Shot_episodeId_fkey` FOREIGN KEY (`episodeId`) REFERENCES `Episode`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shot` ADD CONSTRAINT `Shot_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Character`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Shot` ADD CONSTRAINT `Shot_sceneId_fkey` FOREIGN KEY (`sceneId`) REFERENCES `Scene`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Asset` ADD CONSTRAINT `Asset_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
