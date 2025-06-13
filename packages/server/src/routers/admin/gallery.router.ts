import { z } from "zod";
import { db } from "../../common/prisma";
import { protectedPermissionProcedure, router } from "../../trpc/trpc";

//TODO: fix this
export const galleryRouter: any = router({
  getAllGallery: protectedPermissionProcedure(["READ_GALLERY"])
    .input(z.object({ altName: z.string().optional() }))
    .query(async ({ input }) => {
      const { altName } = input;
      return db.mediaFile.findMany({
        where: altName
          ? { altName: { contains: altName, mode: "insensitive" } }
          : undefined,
      });
    }),

  deleteMediaFile: protectedPermissionProcedure(["DELETE_GALLERY"])
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return db.mediaFile.delete({
        where: { id: input.id },
      });
    }),
});
