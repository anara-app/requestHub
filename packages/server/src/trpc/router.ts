import { router } from "./trpc";
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
/* Admin routers */
import { authRouter } from "../routers/admin/auth.router";
import { usersRouter } from "../routers/admin/users.router";
import { rolesRouter } from "../routers/admin/roles.router";
import { languageRouter } from "../routers/admin/languages.router";
/* Client routers */
import { clientArticleRouter } from "../routers/client/article.router";
import { galleryRouter } from "../routers/admin/gallery.router";

export const appRouter = router({
  admin: {
    auth: authRouter,
    users: usersRouter,
    roles: rolesRouter,
    languages: languageRouter,
    gallery: galleryRouter,
  },

  nextClient: {
    articles: clientArticleRouter,
  },
});

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
export type AppRouter = typeof appRouter;
