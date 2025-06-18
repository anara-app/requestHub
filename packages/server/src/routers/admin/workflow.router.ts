import { z } from "zod";
import { protectedPermissionProcedure, router } from "../../trpc/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "../../common/prisma";
import { RequestStatus } from "@prisma/client";

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(
    z.object({
      role: z.string(),
      type: z.string(),
      label: z.string(),
    })
  ),
});

export const adminWorkflowRouter = router({
  // Get all workflow templates
  getTemplates: protectedPermissionProcedure(["MANAGE_WORKFLOW_TEMPLATES" as any])
    .query(async () => {
      return db.workflowTemplate.findMany({
        orderBy: { createdAt: "desc" },
      });
    }),

  // Create a new workflow template
  createTemplate: protectedPermissionProcedure(["MANAGE_WORKFLOW_TEMPLATES" as any])
    .input(createTemplateSchema)
    .mutation(async ({ input }) => {
      return db.workflowTemplate.create({
        data: {
          name: input.name,
          description: input.description,
          steps: JSON.stringify(input.steps),
          isActive: true,
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
    .mutation(async ({ input }) => {
      const template = await db.workflowTemplate.findUnique({
        where: { id: input.id },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow template not found",
        });
      }

      return db.workflowTemplate.update({
        where: { id: input.id },
        data: {
          name: input.data.name,
          description: input.data.description,
          steps: JSON.stringify(input.data.steps),
        },
      });
    }),

  // Delete workflow template
  deleteTemplate: protectedPermissionProcedure(["MANAGE_WORKFLOW_TEMPLATES" as any])
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const template = await db.workflowTemplate.findUnique({
        where: { id: input.id },
      });

      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workflow template not found",
        });
      }

      return db.workflowTemplate.delete({
        where: { id: input.id },
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
}); 