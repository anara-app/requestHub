import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db } from "../../common/prisma";
import { $Enums } from "../../common/prisma";
import { auth } from "../../lib/auth";
import { WorkflowAssignmentService } from "../../services/workflow-assignment.service";
import {
  protectedPermissionProcedure,
  protectedProcedure,
  router,
} from "../../trpc/trpc";

export const usersRouter = router({
  getUsers: protectedPermissionProcedure(["READ_USERS"])
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().default(100),
      })
    )
    .query(async ({ input }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [users, totalCount] = await Promise.all([
        db.user.findMany({
          where: {
            firstName: {
              contains: input?.search || undefined,
              mode: "insensitive",
            },
            lastName: {
              contains: input?.search || undefined,
              mode: "insensitive",
            },
            email: {
              contains: input?.search || undefined,
              mode: "insensitive",
            },
          },
          skip,
          take: limit,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            createdAt: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        db.user.count(),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
        },
      };
    }),

  deleteUser: protectedPermissionProcedure(["DELETE_USER"])
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id } }) => {
      try {
        // Check if user has created workflow requests
        const workflowRequestsCount = await db.workflowRequest.count({
          where: { initiatorId: id },
        });

        if (workflowRequestsCount > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot delete user: they have created ${workflowRequestsCount} workflow request(s). Please transfer or delete these requests first.`,
          });
        }

        // Check if user has subordinates (is a manager)
        const subordinatesCount = await db.user.count({
          where: { managerId: id },
        });

        if (subordinatesCount > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot delete user: they manage ${subordinatesCount} subordinate(s). Please reassign these users to another manager first.`,
          });
        }

        // Check if user has pending workflow approvals
        const pendingApprovalsCount = await db.workflowApproval.count({
          where: {
            approverId: id,
            status: "PENDING",
          },
        });

        if (pendingApprovalsCount > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot delete user: they have ${pendingApprovalsCount} pending workflow approval(s). Please reassign or complete these approvals first.`,
          });
        }

        // If all checks pass, delete the user
        await db.user.delete({
          where: { id },
        });

        return { success: true, message: "User successfully deleted" };
      } catch (error: any) {
        console.log({ error });

        // If it's already a TRPCError, re-throw it
        if (error.code) {
          throw error;
        }

        // Handle other database constraint errors
        if (error.code === "P2003") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Cannot delete user due to existing references. Please remove all related data first.",
          });
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Failed to delete user",
        });
      }
    }),

  getUserById: protectedPermissionProcedure(["READ_USERS"])
    .input(z.object({ id: z.string() }))
    .query(async ({ input: { id } }) => {
      const user = await db.user.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          roleId: true,
          createdAt: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      return user;
    }),

  updateUser: protectedPermissionProcedure(["UPDATE_USER"])
    .input(
      z.object({
        id: z.string(),
        data: z.object({
          firstName: z.string(),
          lastName: z.string(),
          email: z.string().email(),
          phoneNumber: z.string(),
          roleId: z.string(),
          password: z
            .string()
            .min(6, "Пароль должен быть не менее 6 символов")
            .optional()
            .or(z.literal("")),
        }),
      })
    )
    .mutation(async ({ input: { id, data } }) => {
      try {
        if (data.password) {
          // TODO: Implement password update
          // const updatedPassword = await auth.api.setPassword({
          //   body: {
          //     newPassword: data.password,
          //   },
          // });
          // console.log({ updatedPassword });
        } else {
          delete data.password;
        }

        const updatedUser = await db.user.update({
          where: { id },
          data,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        });
        return updatedUser;
      } catch (error) {
        console.log({ error });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Не удалось обновить пользователя",
        });
      }
    }),

  createUser: protectedPermissionProcedure(["CREATE_USER"])
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        phoneNumber: z.string(),
        password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
        roleId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const isExistingEmail = await db.user.findFirst({
          where: { email: input.email },
        });

        if (isExistingEmail) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Пользователь с таким email уже существует",
          });
        }
        const body = {
          email: input.email,
          password: input.password,
          name: `${input.firstName} ${input.lastName}`,
        };

        // Use better-auth to create the user
        const response = await auth.api.signUpEmail({
          body,
        });

        const userId = response.user.id;

        const user = await db.user.update({
          where: { id: userId },
          data: {
            firstName: input.firstName,
            lastName: input.lastName,
            phoneNumber: input.phoneNumber,
            roleId: input.roleId,
          },
        });

        return user;
      } catch (error: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error?.message || "Не удалось создать пользователя",
        });
      }
    }),

  getMe: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;

    if (!user?.id) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not found",
      });
    }

    const userWithRole = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return userWithRole;
  }),

  getMyPermissions: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.user;

    if (!user?.roleId) {
      return [] as $Enums.PermissionOperation[];
    }

    const role = await db.role.findFirst({
      where: { id: user?.roleId },
      include: {
        permissions: true,
      },
    });

    if (!role) {
      return [] as $Enums.PermissionOperation[];
    }

    const myPermissions = role?.permissions
      .filter((permission) => !!permission.action)
      .map((permission) => permission.action!);

    return myPermissions;
  }),

  // Get users with their manager information
  getUsersWithHierarchy: protectedPermissionProcedure(["READ_USERS"])
    .input(
      z.object({
        search: z.string().optional(),
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().default(100),
      })
    )
    .query(async ({ input }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [users, totalCount] = await Promise.all([
        db.user.findMany({
          where: {
            OR: [
              {
                firstName: {
                  contains: input?.search || undefined,
                  mode: "insensitive",
                },
              },
              {
                lastName: {
                  contains: input?.search || undefined,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: input?.search || undefined,
                  mode: "insensitive",
                },
              },
            ],
          },
          skip,
          take: limit,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            createdAt: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            } as any,
            subordinates: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            } as any,
          },
        }),
        db.user.count(),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
        },
      };
    }),

  // Update user's manager
  updateUserManager: protectedPermissionProcedure(["UPDATE_USER"])
    .input(
      z.object({
        userId: z.string(),
        managerId: z.string().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Validate that the manager exists if provided
        if (input.managerId) {
          const manager = await db.user.findUnique({
            where: { id: input.managerId },
          });
          if (!manager) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Manager not found",
            });
          }
        }

        // Prevent circular references
        if (input.managerId === input.userId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User cannot be their own manager",
          });
        }

        // Check for circular hierarchy
        if (input.managerId) {
          const hierarchy = await WorkflowAssignmentService.getUserHierarchy(
            input.managerId
          );
          if (hierarchy.some((user) => user.id === input.userId)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "This would create a circular hierarchy",
            });
          }
        }

        const updatedUser = await db.user.update({
          where: { id: input.userId },
          data: { managerId: input.managerId } as any,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            manager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            } as any,
          },
        });

        return updatedUser;
      } catch (error: any) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error?.message || "Failed to update user manager",
        });
      }
    }),

  // Get user hierarchy (chain of command)
  getUserHierarchy: protectedPermissionProcedure(["READ_USERS"])
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await WorkflowAssignmentService.getUserHierarchy(input.userId);
    }),

  // Get all users that can be managers (for dropdown)
  getPotentialManagers: protectedPermissionProcedure(["READ_USERS"])
    .input(z.object({ excludeUserId: z.string().optional() }))
    .query(async ({ input }) => {
      const users = await db.user.findMany({
        where: {
          ...(input.excludeUserId && {
            id: { not: input.excludeUserId },
          }),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      });

      return users.map((user) => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role?.name,
      }));
    }),

  // Get complete organization hierarchy
  getOrganizationHierarchy: protectedPermissionProcedure(["READ_USERS"]).query(
    async () => {
      // Get all users with their manager and role information
      const users = await (db.user.findMany as any)({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          createdAt: true,
          managerId: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      });

      // Build hierarchy structure
      const buildHierarchy = (
        parentId: string | null,
        visited: Set<string> = new Set()
      ): any[] => {
        return users
          .filter((user: any) => {
            // For top level, include self-managed users or users with no manager
            if (parentId === null) {
              return user.managerId === user.id || user.managerId === null;
            }
            // For subordinates, include users whose manager is the current parent
            return user.managerId === parentId && user.id !== parentId;
          })
          .filter((user: any) => !visited.has(user.id)) // Prevent cycles
          .map((user: any) => {
            const newVisited = new Set(visited);
            newVisited.add(user.id);

            return {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phoneNumber: user.phoneNumber,
              createdAt: user.createdAt,
              role: user.role,
              managerId: user.managerId,
              isSelfManaged: user.managerId === user.id,
              subordinates: buildHierarchy(user.id, newVisited),
            };
          });
      };

      const hierarchy = buildHierarchy(null);

      // Calculate statistics
      const totalUsers = users.length;
      const managersCount = users.filter((user: any) =>
        users.some((u: any) => u.managerId === user.id && u.id !== user.id)
      ).length;
      const topLevelCount = hierarchy.length;
      const rolesCount = new Set(
        users.filter((u: any) => u.role).map((u: any) => u.role!.name)
      ).size;

      return {
        hierarchy,
        statistics: {
          totalUsers,
          managersCount,
          topLevelCount,
          rolesCount,
        },
      };
    }
  ),
});
