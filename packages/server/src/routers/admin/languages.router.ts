import { z } from "zod";
import { protectedProcedure, router } from "../../trpc/trpc";
import { TRPCError } from "@trpc/server";

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
        return [];
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Не удалось загрузить языки",
        });
      }
    }),
});
