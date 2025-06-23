import { router } from "./trpc";
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
/* Admin routers */
import { usersRouter } from "../routers/admin/users.router";
import { rolesRouter } from "../routers/admin/roles.router";
import { languageRouter } from "../routers/admin/languages.router";
import { adminWorkflowRouter } from "../routers/admin/workflow.router";
import { analyticsRouter } from "../routers/admin/analytics.router";
/* Client routers */
import { clientArticleRouter } from "../routers/client/article.router";
import { galleryRouter } from "../routers/admin/gallery.router";
import { workflowRouter } from "../routers/client/workflow.router";

export const appRouter = router({
  admin: {
    users: usersRouter,
    roles: rolesRouter,
    languages: languageRouter,
    gallery: galleryRouter,
    workflows: adminWorkflowRouter,
    analytics: analyticsRouter,
  },

  nextClient: {
    articles: clientArticleRouter,
    workflows: workflowRouter,
  },
});

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
export type AppRouter = typeof appRouter;
