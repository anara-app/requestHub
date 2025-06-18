import { z } from "zod";
import { protectedPermissionProcedure, router } from "../../trpc/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "../../common/prisma";

const createRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  templateId: z.string().uuid(),
  files: z.array(z.string().uuid()).optional(),
  data: z.record(z.any()).optional(),
});

export const workflowRouter = router({
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

      // Create approval records for each step
      const steps = JSON.parse(template.steps as string);
      await Promise.all(
        steps.map((step: any, index: number) =>
          db.workflowApproval.create({
            data: {
              requestId: request.id,
              step: index,
              role: step.role,
              actionLabel: step.label,
              status: index === 0 ? "PENDING" : "SKIPPED",
            },
          })
        )
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
    .query(async ({ ctx }) => {
      return db.workflowRequest.findMany({
        where: {
          initiatorId: ctx.user.id,
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
    }),

  // Get requests that need user's approval - filtered by user's role
  getPendingApprovals: protectedPermissionProcedure(["APPROVE_WORKFLOW_REQUEST" as any])
    .query(async ({ ctx }) => {
      console.log("getPendingApprovals called for user:", ctx.user.id);
      
      // Get user's role
      const user = await db.user.findUnique({
        where: { id: ctx.user.id },
        include: { role: true },
      });

      console.log("User details:", { email: user?.email, role: user?.role?.name });

      if (!user?.role) {
        console.log("No role found for user");
        return [];
      }

      const userRoleName = user.role.name.toLowerCase();
      console.log("User role name (lowercase):", userRoleName);

      // Admin can see all requests that have pending approvals
      if (userRoleName === "admin") {
        return db.workflowRequest.findMany({
          where: {
            status: {
              in: ["PENDING", "IN_PROGRESS"],
            },
            approvals: {
              some: {
                status: "PENDING",
              },
            },
          },
          include: {
            template: true,
            initiator: true,
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
      }

      // For other roles, filter by requests that need their approval
      const result = await db.workflowRequest.findMany({
        where: {
          status: {
            in: ["PENDING", "IN_PROGRESS"],
          },
          approvals: {
            some: {
              status: "PENDING",
              role: {
                equals: userRoleName,
                mode: "insensitive",
              },
            },
          },
        },
        include: {
          template: true,
          initiator: true,
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

      console.log(`Returning ${result.length} requests for ${userRoleName} user`);
      result.forEach((req, index) => {
        console.log(`${index + 1}. ${req.title} (${req.status})`);
      });

      return result;
    }),
}); 