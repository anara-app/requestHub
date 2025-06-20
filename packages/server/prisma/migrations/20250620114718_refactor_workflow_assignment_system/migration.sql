/*
  Warnings:

  - The values [FINANCE] on the enum `WorkflowRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `role` on the `workflow_approval` table. All the data in the column will be lost.
  - Added the required column `assigneeType` to the `workflow_approval` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AssigneeType" AS ENUM ('ROLE_BASED', 'DYNAMIC');

-- Step 1: Add new columns with defaults first
ALTER TABLE "workflow_approval" 
ADD COLUMN "assigneeType" "AssigneeType",
ADD COLUMN "dynamicAssignee" TEXT,
ADD COLUMN "roleBasedAssignee" TEXT;

-- Step 2: Migrate existing data from role column to new format
UPDATE "workflow_approval" SET 
  "assigneeType" = CASE 
    WHEN role = 'INITIATOR_SUPERVISOR' THEN 'DYNAMIC'::"AssigneeType"
    ELSE 'ROLE_BASED'::"AssigneeType"
  END,
  "dynamicAssignee" = CASE 
    WHEN role = 'INITIATOR_SUPERVISOR' THEN 'INITIATOR_SUPERVISOR'
    ELSE NULL
  END,
  "roleBasedAssignee" = CASE 
    WHEN role = 'INITIATOR_SUPERVISOR' THEN NULL
    WHEN role = 'CEO' THEN 'Ceo'
    WHEN role = 'LEGAL' THEN 'Lawyer'
    WHEN role = 'PROCUREMENT' THEN 'Procurement'
    WHEN role = 'FINANCE_MANAGER' THEN 'Finance_manager'
    WHEN role = 'ACCOUNTING' THEN 'Accountant'
    WHEN role = 'HR_SPECIALIST' THEN 'Hr_specialist'
    WHEN role = 'SYSTEM_AUTOMATION' THEN 'System'
    WHEN role = 'SECURITY_REVIEW' THEN 'Security'
    WHEN role = 'SECURITY_GUARD' THEN 'Security Guard'
    WHEN role = 'INDUSTRIAL_SAFETY' THEN 'Safety'
    WHEN role = 'FINANCE' THEN 'Finance_manager'  -- Migrate legacy FINANCE to FINANCE_MANAGER
    ELSE role::text
  END;

-- Step 3: Make assigneeType NOT NULL now that data is migrated
ALTER TABLE "workflow_approval" ALTER COLUMN "assigneeType" SET NOT NULL;

-- Step 4: Drop the old role column
ALTER TABLE "workflow_approval" DROP COLUMN "role";

-- Step 5: Update WorkflowRole enum (remove FINANCE)
-- First update any remaining FINANCE references in other tables if they exist
-- Then alter the enum
BEGIN;
CREATE TYPE "WorkflowRole_new" AS ENUM ('INITIATOR_SUPERVISOR', 'CEO', 'LEGAL', 'PROCUREMENT', 'FINANCE_MANAGER', 'ACCOUNTING', 'HR_SPECIALIST', 'SYSTEM_AUTOMATION', 'SECURITY_REVIEW', 'SECURITY_GUARD', 'INDUSTRIAL_SAFETY');
ALTER TYPE "WorkflowRole" RENAME TO "WorkflowRole_old";
ALTER TYPE "WorkflowRole_new" RENAME TO "WorkflowRole";
DROP TYPE "WorkflowRole_old";
COMMIT;
