import dotenv from "dotenv";
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import fastify from "fastify";
import { createContext } from "./trpc/context";
import { appRouter, type AppRouter } from "./trpc/router";
import cors from "@fastify/cors";
import { mediaRouter } from "./api/media.router";
import fastifyMultipart from "@fastify/multipart";
import sendsible from "@fastify/sensible";
import { CONSTANTS } from "./common/constants";

dotenv.config();

/* Server */
const server = fastify({
  maxParamLength: 50000,
});

/* Plugins */
server.register(fastifyMultipart, {
  limits: {
    fileSize: 1_000_000_000,
  },
});
server.register(sendsible);
server.register(cors, {
  origin: ["*"],
});

/* TRPC */
server.register(fastifyTRPCPlugin, {
  prefix: "/trpc",
  trpcOptions: {
    router: appRouter,
    createContext,
    onError({ path, error }) {
      console.error(`Error in tRPC handler on path '${path}':`, error);
    },
  } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
});

/* REST */
server.register(mediaRouter, {
  prefix: "/api/media",
});

server.get("/api/up", async (_, reply) => {
  console.log("HEALTH-CHECK", new Date().toISOString());
  return reply.send({
    message: "up",
  });
});

/* Main function */
async function startServer() {
  try {
    await server.listen({ port: +CONSTANTS.API_PORT, host: "0.0.0.0" });
    console.log(`Server started successfully on port: ${CONSTANTS.API_PORT}`);
  } catch (err) {
    server.log.error(err);
    console.log(err);
    process.exit(1);
  }
}

startServer();
