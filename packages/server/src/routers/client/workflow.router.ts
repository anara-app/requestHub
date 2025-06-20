import { z } from "zod";
import { protectedPermissionProcedure, router } from "../../trpc/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "../../common/prisma";
import { WorkflowAssignmentService } from "../../services/workflow-assignment.service";

const createRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  templateId: z.string().uuid(),
  files: z.array(z.string().uuid()).optional(),
  data: z.record(z.any()).optional(),
});

export const workflowRouter: any = router({
  // Get available workflow templates
  getTemplates: protectedPermissionProcedure(["CREATE_WORKFLOW_REQUEST" as any])
    .query(async () => {
      return db.workflowTemplate.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Create a new workflow request
  createRequest: protectedPermissionProcedure(["CREATE_WORKFLOW_REQUEST" as any])
    .input(createRequestSchema)
    .mutation(async ({ ctx, input }) => {
      // Get the workflow template
      const template = await db.workflowTemplate.findUnique({
        where: { id: input.templateId },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow template not found",
        });
      }

      // Parse template steps and convert to new format
      const legacySteps = JSON.parse(template.steps as string);
      const stepDefinitions = legacySteps.map((step: any) => 
        WorkflowAssignmentService.convertLegacyRoleToStepDefinition(step.role, step.label)
      );

      // Validate that the workflow can be processed
      const validation = await WorkflowAssignmentService.validateWorkflowRequest(
        stepDefinitions,
        ctx.user.id
      );

      if (!validation.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot create workflow request: ${validation.errors.join(", ")}`,
        });
      }

      // Create the request
      const request = await db.workflowRequest.create({
        data: {
          title: input.title,
          description: input.description,
          status: "PENDING",
          data: input.data || {},
          initiatorId: ctx.user.id,
          templateId: template.id,
          ...(input.files && {
            files: {
              connect: input.files.map((id) => ({ id })),
            },
          }),
        },
        include: {
          initiator: true,
          template: true,
          files: true,
        },
      });

      // Create approval records using the new assignment service
      await WorkflowAssignmentService.createWorkflowApprovals(
        request.id,
        stepDefinitions,
        ctx.user.id
      );

      // Log audit trail - Request created
      await db.workflowAuditTrail.create({
        data: {
          requestId: request.id,
          userId: ctx.user.id,
          action: "REQUEST_CREATED" as any,
          description: `Created new ${template.name} request`,
          details: input.title,
        },
      });

      return request;
    }),

  // Get user's requests
  getMyRequests: protectedPermissionProcedure(["READ_WORKFLOW_REQUESTS" as any])
    .input(z.object({
      search: z.string().optional(),
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(10),
    }))
    .query(async ({ ctx, input }) => {
      const requests = await db.workflowRequest.findMany({
        where: {
          initiatorId: ctx.user.id,
          ...(input.search && {
            OR: [
              { title: { contains: input.search, mode: "insensitive" } },
              { description: { contains: input.search, mode: "insensitive" } },
            ],
          }),
        },
        include: {
          template: true,
          approvals: {
            include: {
              approver: true,
            },
          },
          files: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      return requests;
    }),

  // Get requests that need user's approval - using new assignment system
  getPendingApprovals: protectedPermissionProcedure(["APPROVE_WORKFLOW_REQUEST" as any])
    .query(async ({ ctx }) => {
      console.log("getPendingApprovals called for user:", ctx.user.id);
      
      // Use the new assignment service to get pending approvals for this user
      const pendingApprovals = await WorkflowAssignmentService.getPendingApprovalsForUser(ctx.user.id);
      
      console.log(`Found ${pendingApprovals.length} pending approvals for user ${ctx.user.id}`);
      
      return pendingApprovals;
    }),

  // Approve a workflow request
  approveRequest: protectedPermissionProcedure(["APPROVE_WORKFLOW_REQUEST" as any])
    .input(
      z.object({
        requestId: z.string(),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { requestId, comment } = input;
      const userId = ctx.user.id;

      // Find the pending approval for this user and request
      const currentApproval = await db.workflowApproval.findFirst({
        where: {
          requestId,
          approverId: userId,
          status: "PENDING",
        },
        include: {
          request: {
            include: {
              template: true,
            },
          },
        },
      });

      if (!currentApproval) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No pending approval found for this request",
        });
      }

      const request = currentApproval.request;

      // Update the approval
      await db.workflowApproval.update({
        where: { id: currentApproval.id },
        data: {
          status: "APPROVED",
          comment,
        },
      });

      // Get all approvals for this request to check if it's the last step
      const allApprovals = await db.workflowApproval.findMany({
        where: { requestId },
        orderBy: { step: "asc" },
      });

      const currentStepApprovals = allApprovals.filter(a => a.step === currentApproval.step);
      const allCurrentStepApproved = currentStepApprovals.every(a => a.status === "APPROVED");

      if (allCurrentStepApproved) {
        const nextStepApprovals = allApprovals.filter(a => a.step === currentApproval.step + 1);
        
        if (nextStepApprovals.length > 0) {
          // Move to next step
          await db.workflowRequest.update({
            where: { id: requestId },
            data: {
              currentStep: currentApproval.step + 1,
              status: "IN_PROGRESS",
            },
          });

          // Log audit trail - Step progressed
          await db.workflowAuditTrail.create({
            data: {
              requestId,
              userId,
              action: "STEP_PROGRESSED" as any,
              description: `Approved step ${currentApproval.step + 1} and moved to step ${currentApproval.step + 2}`,
              details: comment || undefined,
            },
          });
        } else {
          // This was the last step - complete the request
          await db.workflowRequest.update({
            where: { id: requestId },
            data: {
              status: "APPROVED",
            },
          });

          // Log audit trail - Request fully approved
          await db.workflowAuditTrail.create({
            data: {
              requestId,
              userId,
              action: "REQUEST_APPROVED" as any,
              description: "Request fully approved and completed",
              details: comment || undefined,
            },
          });
        }
      }

      return { success: true };
    }),

  // Reject a workflow request
  rejectRequest: protectedPermissionProcedure(["APPROVE_WORKFLOW_REQUEST" as any])
    .input(
      z.object({
        requestId: z.string(),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { requestId, comment } = input;
      const userId = ctx.user.id;

      // Find the pending approval for this user and request
      const currentApproval = await db.workflowApproval.findFirst({
        where: {
          requestId,
          approverId: userId,
          status: "PENDING",
        },
      });

      if (!currentApproval) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No pending approval found for this request",
        });
      }

      // Update the approval and request
      await db.$transaction([
        db.workflowApproval.update({
          where: { id: currentApproval.id },
          data: {
            status: "REJECTED",
            comment,
          },
        }),
        db.workflowRequest.update({
          where: { id: requestId },
          data: {
            status: "REJECTED",
          },
        }),
      ]);

      // Log audit trail - Request rejected
      await db.workflowAuditTrail.create({
        data: {
          requestId,
          userId,
          action: "REQUEST_REJECTED" as any,
          description: `Request rejected at step ${currentApproval.step + 1}`,
          details: comment || undefined,
        },
      });

      return { success: true };
    }),
}); 