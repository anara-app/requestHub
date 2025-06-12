import { createTRPCClient, httpLink } from "@trpc/client";
// import type { AppRouter } from "@server/trpc/router";
import { ENV_KEYS } from "./constants";

export const trpcClient = createTRPCClient<any>({
  links: [
    httpLink({
      url: ENV_KEYS.TRPC_URL,
    }),
  ],
});
