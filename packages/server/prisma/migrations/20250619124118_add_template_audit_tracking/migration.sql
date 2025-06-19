/*
  Warnings:

  - Added the required column `createdById` to the `workflow_template` table without a default value. This is not possible if the table is not empty.

*/

-- First, add the columns as nullable
ALTER TABLE "workflow_template" ADD COLUMN     "archivedById" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- Get the first user ID (fallback for existing templates)
-- Update existing templates to have the first available user as creator
UPDATE "workflow_template" 
SET "createdById" = (SELECT "id" FROM "user" ORDER BY "createdAt" ASC LIMIT 1)
WHERE "createdById" IS NULL;

-- Now make createdById non-nullable
ALTER TABLE "workflow_template" ALTER COLUMN "createdById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "workflow_template" ADD CONSTRAINT "workflow_template_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_template" ADD CONSTRAINT "workflow_template_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_template" ADD CONSTRAINT "workflow_template_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
