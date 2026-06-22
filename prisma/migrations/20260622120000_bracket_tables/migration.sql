-- CreateTable
CREATE TABLE `BracketMatch` (
    `id` VARCHAR(191) NOT NULL,
    `stage` ENUM('ROUND_OF_32', 'ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL') NOT NULL,
    `position` INTEGER NOT NULL,
    `homeTeamId` VARCHAR(191) NULL,
    `awayTeamId` VARCHAR(191) NULL,
    `homeSourceMatchId` VARCHAR(191) NULL,
    `awaySourceMatchId` VARCHAR(191) NULL,
    `nextMatchId` VARCHAR(191) NULL,
    `nextMatchSlot` ENUM('HOME', 'AWAY') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BracketMatch_stage_position_key`(`stage`, `position`),
    INDEX `BracketMatch_stage_idx`(`stage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BracketPick` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `bracketMatchId` VARCHAR(191) NOT NULL,
    `winnerTeamId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `BracketPick_userId_idx`(`userId`),
    UNIQUE INDEX `BracketPick_userId_bracketMatchId_key`(`userId`, `bracketMatchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BracketSubmission` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `championTeamId` VARCHAR(191) NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `BracketSubmission_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BracketMatch` ADD CONSTRAINT `BracketMatch_homeTeamId_fkey` FOREIGN KEY (`homeTeamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BracketMatch` ADD CONSTRAINT `BracketMatch_awayTeamId_fkey` FOREIGN KEY (`awayTeamId`) REFERENCES `Team`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BracketMatch` ADD CONSTRAINT `BracketMatch_homeSourceMatchId_fkey` FOREIGN KEY (`homeSourceMatchId`) REFERENCES `BracketMatch`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `BracketMatch` ADD CONSTRAINT `BracketMatch_awaySourceMatchId_fkey` FOREIGN KEY (`awaySourceMatchId`) REFERENCES `BracketMatch`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `BracketPick` ADD CONSTRAINT `BracketPick_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BracketPick` ADD CONSTRAINT `BracketPick_bracketMatchId_fkey` FOREIGN KEY (`bracketMatchId`) REFERENCES `BracketMatch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BracketPick` ADD CONSTRAINT `BracketPick_winnerTeamId_fkey` FOREIGN KEY (`winnerTeamId`) REFERENCES `Team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BracketSubmission` ADD CONSTRAINT `BracketSubmission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BracketSubmission` ADD CONSTRAINT `BracketSubmission_championTeamId_fkey` FOREIGN KEY (`championTeamId`) REFERENCES `Team`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
