import { db } from "../../common/prisma";
import { router } from "../../trpc/trpc";
import { protectedPermissionProcedure } from "../../trpc/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { PermissionOperation } from "@prisma/client";

export const rolesRouter = router({
  // Create role
  createRole: protectedPermissionProcedure(["CREATE_ROLE"])
    .input(
      z.object({
        name: z.string().min(1),
        permissions: z.array(z.nativeEnum(PermissionOperation)),
      })
    )
    .mutation(async ({ input }) => {
      try {
        return await db.role.create({
          data: {
            name: input.name,
            permissions: {
              create: input.permissions.map((permission) => ({
                name: permission,
                action: permission,
              })),
            },
          },
        });
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось создать роль",
          cause: error,
        });
      }
    }),

  // Get single role by ID
  getRole: protectedPermissionProcedure(["READ_ROLES"])
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const role = await db.role.findUnique({
        where: { id: input.id },
        include: {
          permissions: true,
        },
      });

      if (!role) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Роль не найдена",
        });
      }

      return role;
    }),

  // Get all roles
  getRoles: protectedPermissionProcedure(["READ_ROLES"]).query(async () => {
    try {
      return await db.role.findMany({
        orderBy: {
          id: "asc",
        },
      });
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось получить список ролей",
        cause: error,
      });
    }
  }),

  // Update role
  updateRole: protectedPermissionProcedure(["UPDATE_ROLE"])
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1),
        permissions: z.array(z.nativeEnum(PermissionOperation)),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const role = await db.role.findUnique({
          where: { id: input.id },
        });

        if (!role) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Роль не найдена",
          });
        }

        return await db.role.update({
          where: { id: input.id },
          data: {
            name: input.name,
            permissions: {
              deleteMany: {},
              create: input.permissions.map((permission) => ({
                name: permission,
                action: permission,
              })),
            },
          },
        });
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось обновить роль",
          cause: error,
        });
      }
    }),

  // Delete role
  deleteRole: protectedPermissionProcedure(["DELETE_ROLE"])
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      try {
        const role = await db.role.findUnique({
          where: { id: input.id },
        });

        if (!role) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Роль не найдена",
          });
        }

        return await db.role.delete({
          where: { id: input.id },
        });
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось удалить роль",
          cause: error,
        });
      }
    }),
});
