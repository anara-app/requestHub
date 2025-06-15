/* React query */
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "server/src/trpc/router";

/* TRPC */
// @ts-expect-error trpc is not typed TODO: fix this
export const trpc = createTRPCReact<AppRouter>();
