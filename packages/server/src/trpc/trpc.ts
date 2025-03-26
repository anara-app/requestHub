import dotenv from "dotenv";
dotenv.config();

import { TRPCError, initTRPC } from "@trpc/server";
import { Context } from "./context";
import { verifyJWT } from "../common/jwt";
import { $Enums, db } from "../common/prisma";

export async function getUserByToken(token: string) {
  const decoded = verifyJWT(token);
  const user = await db.user.findUnique({
    where: { id: decoded?.userId },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  });
  return user;
}

const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(async ({ next, ctx }) => {
  if (!ctx.token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

  if (ctx.token) {
    try {
      const user = await getUserByToken(ctx.token);
      return next({ ctx: { user } });
    } catch (error) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
      });
    }
  }

  throw new TRPCError({
    code: "UNAUTHORIZED",
  });
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);

export const protectedPermissionProcedure = (
  permissions?: $Enums.PermissionOperation[]
) =>
  protectedProcedure.use(async ({ ctx, next }) => {
    const userData = ctx.user;
    const userPermissions = userData?.role?.permissions
      ?.filter((i) => Boolean(i.action))
      .map((i) => i.action!);

    if (
      !permissions?.some((permission) => userPermissions?.includes(permission))
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "У вас нет разрешения на выполнение этого действия",
      });
    }

    return next({
      ctx: {
        user: ctx.user,
      },
    });
  });
