import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";

export function createContext({ req, res }: CreateFastifyContextOptions) {
  const token = req.headers.authorization?.split(" ")?.[1];
  return { req, res, token };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
