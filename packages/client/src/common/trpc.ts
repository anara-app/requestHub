import { createTRPCClient, httpLink } from "@trpc/client";
import type { AppRouter } from "server/src/trpc/router";
import { ENV_KEYS } from "./constants";

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: ENV_KEYS.TRPC_URL,
    }),
  ],
});
