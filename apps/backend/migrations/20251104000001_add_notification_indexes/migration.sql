-- Add indexes for improved query performance on Notification table
-- Note: This migration adds indexes to the existing Notification table

-- Add index on notificationType for filtering notifications by type
CREATE INDEX `Notification_notificationType_idx` ON `Notification`(`notificationType`);

-- Add index on read status for filtering read/unread notifications
CREATE INDEX `Notification_read_idx` ON `Notification`(`read`);

-- Add index on createdAt for sorting and filtering by creation date
CREATE INDEX `Notification_createdAt_idx` ON `Notification`(`createdAt`);

-- Add index on scheduledFor for querying scheduled notifications
CREATE INDEX `Notification_scheduledFor_idx` ON `Notification`(`scheduledFor`);

