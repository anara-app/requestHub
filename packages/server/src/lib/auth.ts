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
