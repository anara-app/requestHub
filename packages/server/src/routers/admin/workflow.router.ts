import { z } from "zod";
import { protectedPermissionProcedure, router } from "../../trpc/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "../../common/prisma";
import { RequestStatus, WorkflowRole } from "@prisma/client";

// Type definitions for templates with user relations
type TemplateWithUsers = {
  id: string;
  name: string;
  description: string | null;
  steps: any;
  isActive: boolean;
  archivedAt: Date | null;
  archiveReason: string | null;
  createdById: string;
  updatedById: string | null;
  archivedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  updatedBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  archivedBy?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
};

// Helper function to create audit trail entries
async function createAuditTrail(
  requestId: string,
  userId: string,
  action: string,
  description: string,
  details?: string
) {
  try {
    const result = await db.workflowAuditTrail.create({
      data: {
        requestId,
        userId,
        action: action as any,
        description,
        details,
      },
    });
    return result;
  } catch (error) {
    console.error("Error creating audit trail:", error);
    throw error;
  }
}

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(
    z.object({
      assigneeType: z.enum(['ROLE_BASED', 'DYNAMIC']),
      roleBasedAssignee: z.string().optional(),
      dynamicAssignee: z.string().optional(),
      actionLabel: z.string(),
      type: z.string(),
    })
  ),
});

export const adminWorkflowRouter = router({
  // Get active workflow templates only
  getTemplates: protectedPermissionProcedure(["MANAGE_WORKFLOW_TEMPLATES" as any])
    .query(async (): Promise<TemplateWithUsers[]> => {
      return await (db.workflowTemplate.findMany as any)({
        where: { isActive: true },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Create a new workflow template
  createTemplate: protectedPermissionProcedure(["MANAGE_WORKFLOW_TEMPLATES" as any])
    .input(createTemplateSchema)
    .mutation(async ({ input, ctx }): Promise<TemplateWithUsers> => {
      const userId = ctx.user.id;
      
      return await (db.workflowTemplate.create as any)({
        data: {
          name: input.name,
          description: input.description,
          steps: JSON.stringify(input.steps),
          isActive: true,
          createdById: userId,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    }),

  // Update workflow template
  updateTemplate: protectedPermissionProcedure(["MANAGE_WORKFLOW_TEMPLATES" as any])
    .input(
      z.object({
        id: z.string().uuid(),
        data: createTemplateSchema,
      })
    )
    .mutation(async ({ input, ctx }): Promise<TemplateWithUsers> => {
      const userId = ctx.user.id;
      
      const template = await db.workflowTemplate.findUnique({
        where: { id: input.id },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow template not found",
        });
      }

      return await (db.workflowTemplate.update as any)({
        where: { id: input.id },
        data: {
          name: input.data.name,
          description: input.data.description,
          steps: JSON.stringify(input.data.steps),
          updatedById: userId,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    }),

  // Archive workflow template (soft delete)
  archiveTemplate: protectedPermissionProcedure(["MANAGE_WORKFLOW_TEMPLATES" as any])
    .input(z.object({ 
      id: z.string().uuid(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, reason } = input;
      const userId = ctx.user.id;

      const template = await db.workflowTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow template not found",
        });
      }

      if (!template.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Template is already archived",
        });
      }

      // Archive the template
      const updatedTemplate: TemplateWithUsers = await (db.workflowTemplate.update as any)({
        where: { id },
        data: {
          isActive: false,
          archivedAt: new Date(),
          archiveReason: reason,
          archivedById: userId,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          archivedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return updatedTemplate;
    }),

  // Restore archived template
  restoreTemplate: protectedPermissionProcedure(["MANAGE_WORKFLOW_TEMPLATES" as any])
    .input(z.object({ 
      id: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      const { id } = input;

      const template = await db.workflowTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow template not found",
        });
      }

      if (template.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Template is already active",
        });
      }

      // Restore the template
      const updatedTemplate: TemplateWithUsers = await (db.workflowTemplate.update as any)({
        where: { id },
        data: {
          isActive: true,
          archivedAt: null,
          archiveReason: null,
          archivedById: null,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return updatedTemplate;
    }),

  // Get archived templates
  getArchivedTemplates: protectedPermissionProcedure(["MANAGE_WORKFLOW_TEMPLATES" as any])
    .query(async (): Promise<TemplateWithUsers[]> => {
      return await (db.workflowTemplate.findMany as any)({
        where: { isActive: false },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          updatedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          archivedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { archivedAt: "desc" },
      });
    }),

  // Get all workflow requests (for admin view)
  getAllRequests: protectedPermissionProcedure(["READ_WORKFLOW_REQUESTS" as any])
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().default(50),
        status: z.nativeEnum(RequestStatus).optional(),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, status } = input;
      const skip = (page - 1) * limit;

      const where = status ? { status } : {};

      const [requests, totalCount] = await Promise.all([
        db.workflowRequest.findMany({
          where,
          skip,
          take: limit,
          include: {
            template: true,
            initiator: true,
            approvals: {
              include: {
                approver: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        db.workflowRequest.count({ where }),
      ]);

      return {
        requests,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
        },
      };
    }),

  // Get single workflow request by ID
  getRequestById: protectedPermissionProcedure(["READ_WORKFLOW_REQUESTS" as any])
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const request = await db.workflowRequest.findUnique({
        where: { 
          id: input.id,
        },
        include: {
          template: true,
          initiator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              step: "asc",
            },
          },
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      return request;
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
      const userId = ctx.user.id; // Current user ID

      // Get the request with current approvals
      const request = await db.workflowRequest.findUnique({
        where: { id: requestId },
        include: {
          template: true,
          approvals: true,
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      // Find the current step approval
      const currentApproval = await db.workflowApproval.findFirst({
        where: {
          requestId,
          step: request.currentStep,
          status: "PENDING",
        },
      });

      if (!currentApproval) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No pending approval found for current step",
        });
      }

      // Update the approval
      await db.workflowApproval.update({
        where: { id: currentApproval.id },
        data: {
          status: "APPROVED",
          comment,
          approverId: userId,
        },
      });

      // Parse template steps (request is guaranteed to be non-null due to check above)
      const templateSteps = JSON.parse(request!.template.steps as string);
      
      // Check if this was the last step
      const isLastStep = request!.currentStep === templateSteps.length - 1;

      if (isLastStep) {
        // Complete the request
        await db.workflowRequest.update({
          where: { id: requestId },
          data: {
            status: "APPROVED",
          },
        });

        // Log audit trail - Request fully approved
        await createAuditTrail(
          requestId,
          userId,
          "REQUEST_APPROVED",
          "Request fully approved and completed",
          comment || undefined
        );
      } else {
        // Move to next step
        const nextStep = request.currentStep + 1;
        const nextStepTemplate = templateSteps[nextStep];

        // This is legacy code that needs to be updated to use the new workflow assignment service
        // For now, we'll throw an error to indicate this needs to be refactored
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Workflow approval system needs to be updated to use the new flexible assignment system. Please create new requests through the client workflow router.",
        });
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

      // Find the current step approval
      const currentApproval = await db.workflowApproval.findFirst({
        where: {
          requestId,
          status: "PENDING",
        },
      });

      if (!currentApproval) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No pending approval found",
        });
      }

      // Update the approval and request
      await db.$transaction([
        db.workflowApproval.update({
          where: { id: currentApproval.id },
          data: {
            status: "REJECTED",
            comment,
            approverId: userId,
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
      await createAuditTrail(
        requestId,
        userId,
        "REQUEST_REJECTED",
        `Request rejected at step ${currentApproval.step + 1}`,
        comment || undefined
      );

      return { success: true };
    }),

  // Add comment to workflow request
  addComment: protectedPermissionProcedure(["READ_WORKFLOW_REQUESTS" as any])
    .input(
      z.object({
        requestId: z.string(),
        text: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { requestId, text } = input;
      const userId = ctx.user.id;

      // Verify request exists
      const request = await db.workflowRequest.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found",
        });
      }

      const comment = await db.workflowComment.create({
        data: {
          requestId,
          text,
          authorId: userId,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Log audit trail - Comment added
      await createAuditTrail(
        requestId,
        userId,
        "COMMENT_ADDED",
        "Added a comment to the request",
        text.length > 100 ? text.substring(0, 100) + "..." : text
      );

      return comment;
    }),

  // Get audit trail for a workflow request
  getAuditTrail: protectedPermissionProcedure(["READ_WORKFLOW_REQUESTS" as any])
    .input(z.object({ requestId: z.string() }))
    .query(async ({ input }) => {
      const auditTrails = await db.workflowAuditTrail.findMany({
        where: { requestId: input.requestId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return auditTrails;
    }),


}); 