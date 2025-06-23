import cors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";
import sendsible from "@fastify/sensible";
import {
  fastifyTRPCPlugin,
  FastifyTRPCPluginOptions,
} from "@trpc/server/adapters/fastify";
import dotenv from "dotenv";
import fastify from "fastify";
import { authRouter } from "./api/auth.router";
import { mediaRouter } from "./api/media.router";
import { CONSTANTS } from "./common/constants";
import { createContext } from "./trpc/context";
import { appRouter, type AppRouter } from "./trpc/router";

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
  origin: [
    "http://localhost:3000",
    "http://localhost:5174",
    "http://localhost:8080",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:8080",
    "https://0214-77-95-56-40.ngrok-free.app",
  ],
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
