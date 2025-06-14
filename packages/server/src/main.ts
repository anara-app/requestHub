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
import { authRouter } from "./api/auth.router";

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
  origin: ["http://localhost:3000", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  maxAge: 86400,
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

server.register(authRouter, {
  prefix: "/api/auth",
});

server.get("/api/up", async (_, reply) => {
  const timestamp = new Date().toISOString();
  console.log("HEALTH-CHECK", timestamp);
  return reply.send({
    message: "up",
    timestamp,
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
