-- AlterTable
ALTER TABLE "workflow_template" ADD COLUMN     "formFields" JSONB NOT NULL DEFAULT '[]';
