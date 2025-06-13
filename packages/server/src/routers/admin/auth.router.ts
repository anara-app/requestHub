import { z } from "zod";
import { router, publicProcedure } from "../../trpc/trpc";
import { TRPCError } from "@trpc/server";
import { db } from "../../common/prisma";
import { createJWT } from "../../common/jwt";
import bcrypt from "bcrypt";

export const authRouter = router({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().min(1, "E-mail некорректен"),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { email, password } = input;

      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Неверные данные",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Неверный пароль",
        });
      }

      const token = createJWT(user);

      if (!token) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось создать токен",
        });
      }

      return { token, user };
    }),
});
