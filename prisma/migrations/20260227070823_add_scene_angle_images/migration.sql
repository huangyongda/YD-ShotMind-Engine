-- CreateTable
CREATE TABLE `SceneAngleImage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sceneId` INTEGER NOT NULL,
    `angle` VARCHAR(50) NOT NULL,
    `filePath` VARCHAR(500) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SceneAngleImage_sceneId_angle_key`(`sceneId`, `angle`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SceneAngleImage` ADD CONSTRAINT `SceneAngleImage_sceneId_fkey` FOREIGN KEY (`sceneId`) REFERENCES `Scene`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
