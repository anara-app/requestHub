import { z } from "zod";
import { protectedPermissionProcedure, router } from "../../trpc/trpc";
import { db } from "../../common/prisma";
import { RequestStatus } from "@prisma/client";

export const analyticsRouter = router({
  getDashboardMetrics: protectedPermissionProcedure(["READ_ANALYTICS"])
    .query(async () => {
      // Get all requests count
      const totalRequests = await db.workflowRequest.count();

      // Get active users count (users who have made requests in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsersResult = await db.workflowRequest.findMany({
        where: {
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          initiatorId: true,
        },
        distinct: ['initiatorId'],
      });
      const activeUsers = activeUsersResult.length;

      // Get pending approvals count
      const pendingApprovals = await db.workflowApproval.count({
        where: {
          status: "PENDING",
        },
      });

      // Get approved requests count
      const approvedRequests = await db.workflowRequest.count({
        where: {
          status: RequestStatus.APPROVED,
        },
      });

      // Get rejected requests count
      const rejectedRequests = await db.workflowRequest.count({
        where: {
          status: RequestStatus.REJECTED,
        },
      });

      // Calculate average processing time
      const processedRequests = await db.workflowRequest.findMany({
        where: {
          status: {
            in: [RequestStatus.APPROVED, RequestStatus.REJECTED],
          },
        },
        select: {
          createdAt: true,
          updatedAt: true,
        },
      });

      let avgProcessingTime = 0;
      if (processedRequests.length > 0) {
        const totalProcessingTime = processedRequests.reduce((total, request) => {
          const processingTime = request.updatedAt.getTime() - request.createdAt.getTime();
          return total + processingTime;
        }, 0);
        
        // Convert to days
        avgProcessingTime = totalProcessingTime / (processedRequests.length * 24 * 60 * 60 * 1000);
      }

      return {
        totalRequests,
        activeUsers,
        pendingApprovals,
        approvedRequests,
        rejectedRequests,
        avgProcessingTime: Math.round(avgProcessingTime * 10) / 10, // Round to 1 decimal place
      };
    }),

  getRequestTrends: protectedPermissionProcedure(["READ_ANALYTICS"])
    .input(
      z.object({
        days: z.number().int().positive().default(30),
      })
    )
    .query(async ({ input }) => {
      const { days } = input;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const requests = await db.workflowRequest.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          createdAt: true,
          status: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // Group by date
      const trendData: { [key: string]: { total: number; approved: number; rejected: number; pending: number } } = {};
      
      requests.forEach((request) => {
        const dateKey = request.createdAt.toISOString().split('T')[0];
        if (!trendData[dateKey]) {
          trendData[dateKey] = { total: 0, approved: 0, rejected: 0, pending: 0 };
        }
        trendData[dateKey].total++;
        
        if (request.status === RequestStatus.APPROVED) {
          trendData[dateKey].approved++;
        } else if (request.status === RequestStatus.REJECTED) {
          trendData[dateKey].rejected++;
        } else {
          trendData[dateKey].pending++;
        }
      });

      // Convert to array format
      const trends = Object.entries(trendData).map(([date, data]) => ({
        date,
        ...data,
      }));

      return trends;
    }),

  getStatusDistribution: protectedPermissionProcedure(["READ_ANALYTICS"])
    .query(async () => {
      const statusCounts = await db.workflowRequest.groupBy({
        by: ['status'],
        _count: {
          status: true,
        },
      });

      return statusCounts.map(item => ({
        status: item.status,
        count: item._count.status,
      }));
    }),

  getTopPerformers: protectedPermissionProcedure(["READ_ANALYTICS"])
    .query(async () => {
      // Get users with most approved requests
      const topApprovers = await db.workflowApproval.groupBy({
        by: ['approverId'],
        where: {
          status: "APPROVED",
          approverId: { not: null },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      });

      // Get user details for top approvers
      const approverIds = topApprovers.map(item => item.approverId).filter(Boolean) as string[];
      const approverDetails = await db.user.findMany({
        where: {
          id: { in: approverIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      const topApproversWithDetails = topApprovers.map(approver => {
        const userDetail = approverDetails.find(user => user.id === approver.approverId);
        return {
          userId: approver.approverId,
          approvalCount: approver._count.id,
          user: userDetail,
        };
      });

      // Get users with most requests created
      const topInitiators = await db.workflowRequest.groupBy({
        by: ['initiatorId'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 5,
      });

      // Get user details for top initiators
      const initiatorIds = topInitiators.map(item => item.initiatorId);
      const initiatorDetails = await db.user.findMany({
        where: {
          id: { in: initiatorIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      const topInitiatorsWithDetails = topInitiators.map(initiator => {
        const userDetail = initiatorDetails.find(user => user.id === initiator.initiatorId);
        return {
          userId: initiator.initiatorId,
          requestCount: initiator._count.id,
          user: userDetail,
        };
      });

      return {
        topApprovers: topApproversWithDetails,
        topInitiators: topInitiatorsWithDetails,
      };
    }),

  getTemplateUsage: protectedPermissionProcedure(["READ_ANALYTICS"])
    .query(async () => {
      const templateUsage = await db.workflowRequest.groupBy({
        by: ['templateId'],
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      });

      // Get template details
      const templateIds = templateUsage.map(item => item.templateId);
      const templates = await db.workflowTemplate.findMany({
        where: {
          id: { in: templateIds },
        },
        select: {
          id: true,
          name: true,
          description: true,
        },
      });

      // Calculate success rates for each template
      const templateStats = await Promise.all(
        templateUsage.map(async (usage) => {
          const template = templates.find(t => t.id === usage.templateId);
          
          const approvedCount = await db.workflowRequest.count({
            where: {
              templateId: usage.templateId,
              status: RequestStatus.APPROVED,
            },
          });

          const successRate = (approvedCount / usage._count.id) * 100;

          return {
            templateId: usage.templateId,
            template,
            totalRequests: usage._count.id,
            approvedRequests: approvedCount,
            successRate: Math.round(successRate * 10) / 10,
          };
        })
      );

      return templateStats;
    }),
}); 