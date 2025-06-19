/*
  Warnings:

  - Changed the type of `role` on the `workflow_approval` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "WorkflowRole" AS ENUM ('INITIATOR', 'INITIATOR_SUPERVISOR', 'CEO', 'LEGAL', 'PROCUREMENT', 'FINANCE_MANAGER', 'ACCOUNTING', 'HR_SPECIALIST', 'SYSTEM_AUTOMATION', 'SECURITY_REVIEW', 'SECURITY_GUARD', 'INDUSTRIAL_SAFETY', 'MANAGER', 'FINANCE');

-- AlterTable
ALTER TABLE "workflow_approval" DROP COLUMN "role",
ADD COLUMN     "role" "WorkflowRole" NOT NULL;
