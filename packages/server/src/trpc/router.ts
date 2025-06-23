import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { galleryRouter } from "../routers/admin/gallery.router";
import { languageRouter } from "../routers/admin/languages.router";
import { rolesRouter } from "../routers/admin/roles.router";
import { usersRouter } from "../routers/admin/users.router";
import { adminWorkflowRouter } from "../routers/admin/workflow.router";
import { workflowRouter } from "../routers/client/workflow.router";
import { router } from "./trpc";

export const appRouter = router({
  admin: {
    users: usersRouter,
    roles: rolesRouter,
    languages: languageRouter,
    gallery: galleryRouter,
    workflows: adminWorkflowRouter,
  },

  nextClient: {
    workflows: workflowRouter,
  },
});

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;
export type AppRouter = typeof appRouter;
