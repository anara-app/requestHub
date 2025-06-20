/*
  Warnings:

  - The values [INITIATOR] on the enum `WorkflowRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WorkflowRole_new" AS ENUM ('INITIATOR_SUPERVISOR', 'CEO', 'LEGAL', 'PROCUREMENT', 'FINANCE_MANAGER', 'ACCOUNTING', 'HR_SPECIALIST', 'SYSTEM_AUTOMATION', 'SECURITY_REVIEW', 'SECURITY_GUARD', 'INDUSTRIAL_SAFETY', 'MANAGER', 'FINANCE');
ALTER TABLE "workflow_approval" ALTER COLUMN "role" TYPE "WorkflowRole_new" USING ("role"::text::"WorkflowRole_new");
ALTER TYPE "WorkflowRole" RENAME TO "WorkflowRole_old";
ALTER TYPE "WorkflowRole_new" RENAME TO "WorkflowRole";
DROP TYPE "WorkflowRole_old";
COMMIT;
