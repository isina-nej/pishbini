-- User stats counters + OTP table
ALTER TABLE `User`
  ADD COLUMN `correctCount` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `wrongCount` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `referralCount` INTEGER NOT NULL DEFAULT 0;

-- Backfill correct/wrong from settled predictions
UPDATE `User` u
SET
  u.`correctCount` = (
    SELECT COUNT(*) FROM `Prediction` p
    WHERE p.`userId` = u.`id` AND p.`isCorrect` = true
  ),
  u.`wrongCount` = (
    SELECT COUNT(*) FROM `Prediction` p
    WHERE p.`userId` = u.`id` AND p.`isCorrect` = false
  );

-- Backfill referral count
UPDATE `User` u
SET u.`referralCount` = (
  SELECT COUNT(*) FROM `Referral` r WHERE r.`referrerUserId` = u.`id`
);

CREATE TABLE `Otp` (
  `id` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Otp_phone_key`(`phone`),
  INDEX `Otp_phone_idx`(`phone`),
  INDEX `Otp_expiresAt_idx`(`expiresAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
