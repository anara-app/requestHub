import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "../common/prisma";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  rateLimit: {
    window: 10, // time window in seconds
    max: 100, // max requests in the window
  },
  // for local development
  trustedOrigins: ["http://localhost:8080", "http://localhost:5174"],
  advanced: {
    defaultCookieAttributes: {
      sameSite: "None",
      secure: true,
    },
    cookies: {
      session_token: {
        name: "session_token",
      },
    },
  },
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
});
