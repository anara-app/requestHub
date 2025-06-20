/*
  Warnings:

  - The values [REQUEST_ARCHIVED] on the enum `AuditAction` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `archivedAt` on the `workflow_request` table. All the data in the column will be lost.
  - You are about to drop the column `isArchived` on the `workflow_request` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('REQUEST_CREATED', 'REQUEST_SUBMITTED', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'REQUEST_CANCELLED', 'TEMPLATE_ARCHIVED', 'TEMPLATE_RESTORED', 'COMMENT_ADDED', 'STEP_PROGRESSED');
ALTER TABLE "workflow_audit_trail" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "AuditAction_old";
COMMIT;

-- AlterTable
ALTER TABLE "workflow_request" DROP COLUMN "archivedAt",
DROP COLUMN "isArchived";

-- AlterTable
ALTER TABLE "workflow_template" ADD COLUMN     "archiveReason" TEXT,
ADD COLUMN     "archivedAt" TIMESTAMP(3);
