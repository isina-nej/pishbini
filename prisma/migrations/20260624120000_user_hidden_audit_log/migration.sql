-- AlterTable
ALTER TABLE `User` ADD COLUMN `hidden` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `AdminAuditLog` ADD COLUMN `actorType` VARCHAR(191) NOT NULL DEFAULT 'ADMIN',
    ADD COLUMN `actorUserId` VARCHAR(191) NULL,
    ADD COLUMN `actorLabel` VARCHAR(191) NULL,
    ADD COLUMN `summary` TEXT NULL,
    ADD COLUMN `ip` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `AdminAuditLog_action_idx` ON `AdminAuditLog`(`action`);
CREATE INDEX `AdminAuditLog_actorType_idx` ON `AdminAuditLog`(`actorType`);
CREATE INDEX `AdminAuditLog_actorUserId_idx` ON `AdminAuditLog`(`actorUserId`);
CREATE INDEX `AdminAuditLog_createdAt_idx` ON `AdminAuditLog`(`createdAt`);
