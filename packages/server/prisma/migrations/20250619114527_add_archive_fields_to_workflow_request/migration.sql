-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'REQUEST_ARCHIVED';

-- AlterTable
ALTER TABLE "workflow_request" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;
