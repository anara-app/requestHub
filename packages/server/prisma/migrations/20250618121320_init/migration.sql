-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('IMAGE', 'VIDEO', 'PDF', 'FILE');

-- CreateEnum
CREATE TYPE "PermissionOperation" AS ENUM ('CREATE_USER', 'READ_USERS', 'UPDATE_USER', 'DELETE_USER', 'CREATE_ROLE', 'READ_ROLES', 'UPDATE_ROLE', 'DELETE_ROLE', 'READ_GALLERY', 'UPDATE_GALLERY', 'DELETE_GALLERY', 'CREATE_WORKFLOW_REQUEST', 'READ_WORKFLOW_REQUESTS', 'UPDATE_WORKFLOW_REQUEST', 'DELETE_WORKFLOW_REQUEST', 'APPROVE_WORKFLOW_REQUEST', 'REJECT_WORKFLOW_REQUEST', 'MANAGE_WORKFLOW_TEMPLATES');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('REQUEST_CREATED', 'REQUEST_SUBMITTED', 'REQUEST_APPROVED', 'REQUEST_REJECTED', 'REQUEST_CANCELLED', 'COMMENT_ADDED', 'STEP_PROGRESSED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "pushNotificationToken" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "phoneNumber" TEXT,
    "address" TEXT,
    "roleId" TEXT,
    "profilePictureId" TEXT,
    "name" TEXT,
    "emailVerified" BOOLEAN DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "scope" TEXT,
    "password" TEXT,
    "userId" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "id" TEXT NOT NULL,
    "description" TEXT,
    "action" "PermissionOperation",
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media_file" (
    "id" TEXT NOT NULL,
    "filename" TEXT,
    "originalFileName" TEXT,
    "altName" TEXT,
    "url" TEXT,
    "type" "FileType" DEFAULT 'IMAGE',
    "width" INTEGER DEFAULT 0,
    "height" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_template" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_request" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "data" JSONB NOT NULL DEFAULT '{}',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "templateId" TEXT NOT NULL,
    "initiatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_approval" (
    "id" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "step" INTEGER NOT NULL,
    "role" TEXT NOT NULL,
    "actionLabel" TEXT,
    "requestId" TEXT NOT NULL,
    "approverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_comment" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_audit_trail" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "description" TEXT NOT NULL,
    "details" TEXT,
    "requestId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_audit_trail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MediaFileToWorkflowRequest" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MediaFileToWorkflowRequest_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "workflow_audit_trail_requestId_idx" ON "workflow_audit_trail"("requestId");

-- CreateIndex
CREATE INDEX "workflow_audit_trail_userId_idx" ON "workflow_audit_trail"("userId");

-- CreateIndex
CREATE INDEX "workflow_audit_trail_createdAt_idx" ON "workflow_audit_trail"("createdAt");

-- CreateIndex
CREATE INDEX "_MediaFileToWorkflowRequest_B_index" ON "_MediaFileToWorkflowRequest"("B");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_profilePictureId_fkey" FOREIGN KEY ("profilePictureId") REFERENCES "media_file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_request" ADD CONSTRAINT "workflow_request_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "workflow_template"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_request" ADD CONSTRAINT "workflow_request_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_approval" ADD CONSTRAINT "workflow_approval_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "workflow_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_approval" ADD CONSTRAINT "workflow_approval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_comment" ADD CONSTRAINT "workflow_comment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "workflow_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_comment" ADD CONSTRAINT "workflow_comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_audit_trail" ADD CONSTRAINT "workflow_audit_trail_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "workflow_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_audit_trail" ADD CONSTRAINT "workflow_audit_trail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MediaFileToWorkflowRequest" ADD CONSTRAINT "_MediaFileToWorkflowRequest_A_fkey" FOREIGN KEY ("A") REFERENCES "media_file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MediaFileToWorkflowRequest" ADD CONSTRAINT "_MediaFileToWorkflowRequest_B_fkey" FOREIGN KEY ("B") REFERENCES "workflow_request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
