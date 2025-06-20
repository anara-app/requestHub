import dotenv from "dotenv";
dotenv.config();

import { fromNodeHeaders } from "better-auth/node";
import { TRPCError, initTRPC } from "@trpc/server";
import { Context } from "./context";
import { $Enums, db, User, Prisma } from "../common/prisma";
import { auth } from "../lib/auth";

const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(async ({ next, ctx }) => {
  // Convert Fastify headers to Headers object for better-auth
  const headers = new Headers();
  Object.entries(ctx.req.headers).forEach(([key, value]) => {
    if (value !== undefined) {
      const headerValue = Array.isArray(value) ? value.join(', ') : String(value);
      headers.set(key, headerValue);
    }
  });
  
  const session = await auth.api.getSession({
    headers: headers,
  });

  if (!session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication token is missing",
    });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found",
    });
  }

  return next({ ctx: { user } });
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);

export type UserWithRole = User & {
  role: { permissions: Prisma.RolePermissionGetPayload<{}>[] } | null;
};

/**
 * Protected procedure that requires specific permissions
 * @param permissions Array of required permissions to access the endpoint
 * @param requireAll If true, user must have ALL specified permissions. If false, user must have ANY of the specified permissions.
 * @returns TRPC procedure with permission checks
 */
export const protectedPermissionProcedure = (
  permissions?: $Enums.PermissionOperation[],
  requireAll: boolean = false
) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    // Safe type assertion since this is guaranteed by protectedProcedure
    const userData = ctx.user as UserWithRole;

    if (!userData.role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "User has no assigned role",
      });
    }

    // Extract and validate permissions
    const userPermissions: $Enums.PermissionOperation[] =
      userData.role.permissions
        .filter((p: Prisma.RolePermissionGetPayload<{}>) => {
          return p.action !== null && p.action !== undefined;
        })
        .map(
          (p: Prisma.RolePermissionGetPayload<{}>) =>
            p.action as $Enums.PermissionOperation
        );

    // If permissions are required, check them
    if (permissions && permissions.length > 0) {
      const hasPermissions = requireAll
        ? permissions.every((permission) =>
            userPermissions.includes(permission)
          )
        : permissions.some((permission) =>
            userPermissions.includes(permission)
          );

      if (!hasPermissions) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: requireAll
            ? "User must have all required permissions"
            : "Insufficient permissions to perform this action",
        });
      }
    }

    return next({
      ctx: {
        user: userData,
        permissions: userPermissions,
      },
    });
  });
