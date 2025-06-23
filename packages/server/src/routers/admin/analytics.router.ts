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
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
        groupBy: z.enum(['day', 'week', 'month']).default('day'),
        templateId: z.string().uuid().optional(),
        days: z.number().int().positive().default(30), // Fallback for backward compatibility
      })
    )
    .query(async ({ input }) => {
      try {
        const { startDate, endDate, groupBy, templateId, days } = input;
        
        // Determine date range
        let queryStartDate: Date;
        let queryEndDate: Date;
        
        if (startDate && endDate) {
          queryStartDate = new Date(startDate);
          queryEndDate = new Date(endDate);
        } else {
          queryEndDate = new Date();
          queryStartDate = new Date();
          queryStartDate.setDate(queryStartDate.getDate() - days);
        }

        // Build where clause
        const whereClause: any = {
          createdAt: {
            gte: queryStartDate,
            lte: queryEndDate,
          },
        };

        if (templateId) {
          whereClause.templateId = templateId;
        }

        const requests = await db.workflowRequest.findMany({
          where: whereClause,
          select: {
            createdAt: true,
            status: true,
            templateId: true,
            template: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        // Helper function to get date key based on groupBy
        const getDateKey = (date: Date, groupBy: string): string => {
          switch (groupBy) {
            case 'day':
              return date.toISOString().split('T')[0];
            case 'week':
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay());
              return weekStart.toISOString().split('T')[0];
            case 'month':
              return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            default:
              return date.toISOString().split('T')[0];
          }
        };

        // Group by date and calculate metrics
        const trendData: { [key: string]: { 
          total: number; 
          approved: number; 
          rejected: number; 
          pending: number;
          inProgress: number;
          draft: number;
          cancelled: number;
        } } = {};
        
        requests.forEach((request) => {
          const dateKey = getDateKey(request.createdAt, groupBy);
          
          if (!trendData[dateKey]) {
            trendData[dateKey] = { 
              total: 0, 
              approved: 0, 
              rejected: 0, 
              pending: 0,
              inProgress: 0,
              draft: 0,
              cancelled: 0
            };
          }
          
          trendData[dateKey].total++;
          
          switch (request.status) {
            case RequestStatus.APPROVED:
              trendData[dateKey].approved++;
              break;
            case RequestStatus.REJECTED:
              trendData[dateKey].rejected++;
              break;
            case RequestStatus.PENDING:
              trendData[dateKey].pending++;
              break;
            case RequestStatus.IN_PROGRESS:
              trendData[dateKey].inProgress++;
              break;
            case RequestStatus.DRAFT:
              trendData[dateKey].draft++;
              break;
            case RequestStatus.CANCELLED:
              trendData[dateKey].cancelled++;
              break;
          }
        });

        // Convert to array format and fill missing dates
        const trends = Object.entries(trendData).map(([date, data]) => ({
          date,
          ...data,
        }));

        // Sort by date
        trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
          trends,
          summary: {
            totalRequests: requests.length,
            dateRange: {
              start: queryStartDate.toISOString(),
              end: queryEndDate.toISOString(),
            },
            groupBy,
            templateFilter: templateId || null,
          },
        };
      } catch (error) {
        console.error('Error fetching request trends:', error);
        throw new Error('Failed to fetch request trends data');
      }
    }),

  getStatusDistribution: protectedPermissionProcedure(["READ_ANALYTICS"])
    .query(async () => {
      try {
        const statusCounts = await db.workflowRequest.groupBy({
          by: ['status'],
          _count: {
            status: true,
          },
          orderBy: {
            _count: {
              status: 'desc',
            },
          },
        });

        return statusCounts.map(item => ({
          status: item.status,
          count: item._count.status,
        }));
      } catch (error) {
        console.error('Error fetching status distribution:', error);
        throw new Error('Failed to fetch status distribution data');
      }
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

  getAvailableTemplates: protectedPermissionProcedure(["READ_ANALYTICS"])
    .query(async () => {
      try {
        const templates = await db.workflowTemplate.findMany({
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
          },
          orderBy: {
            name: 'asc',
          },
        });

        return templates;
      } catch (error) {
        console.error('Error fetching available templates:', error);
        throw new Error('Failed to fetch available templates');
      }
    }),
}); 