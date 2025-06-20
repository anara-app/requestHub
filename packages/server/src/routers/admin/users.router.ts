import { z } from "zod";
import {
  protectedPermissionProcedure,
  protectedProcedure,
  router,
} from "../../trpc/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "../../common/prisma";
import bcrypt from "bcrypt";
import { $Enums } from "../../common/prisma";
import { WorkflowAssignmentService } from "../../services/workflow-assignment.service";

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
        await db.user.delete({
          where: { id },
        });
        return { success: true, message: "Пользователь успешно удален" };
      } catch (error) {
        console.log({ error });
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Не удалось удалить пользователя",
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
          const passwordHash = await bcrypt.hash(data.password, 10);
          data.password = passwordHash;
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

        const passwordHash = await bcrypt.hash(input.password, 10);
        const newUser = await db.user.create({
          data: {
            ...input,
            roleId: input.roleId,
            password: passwordHash,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        });
        return newUser;
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
          const hierarchy = await WorkflowAssignmentService.getUserHierarchy(input.managerId);
          if (hierarchy.some(user => user.id === input.userId)) {
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
        orderBy: [
          { firstName: "asc" },
          { lastName: "asc" },
        ],
      });

      return users.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role?.name,
      }));
    }),
});
