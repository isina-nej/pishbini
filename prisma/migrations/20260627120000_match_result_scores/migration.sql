-- AlterTable
ALTER TABLE `Match` ADD COLUMN `homeScore` INTEGER NULL,
    ADD COLUMN `awayScore` INTEGER NULL,
    ADD COLUMN `resultUpdatedAt` DATETIME(3) NULL,
    ADD COLUMN `settlementPushScheduledAt` DATETIME(3) NULL,
    ADD COLUMN `settlementPushSentAt` DATETIME(3) NULL;
