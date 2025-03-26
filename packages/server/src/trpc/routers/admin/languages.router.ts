import { z } from "zod";
import { protectedProcedure, router } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { db } from "../../../common/prisma";

export const languageRouter = router({
  // Get all languages
  getLanguages: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const languages = await db.language.findMany({
          where: input.name
            ? { name: { contains: input.name, mode: "insensitive" } }
            : undefined,
          orderBy: {
            createdAt: "desc",
          },
        });

        return languages;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось загрузить языки",
        });
      }
    }),
});
