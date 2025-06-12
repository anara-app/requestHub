import { PrismaClient } from "@prisma/client";

export type {
  PrismaClient,
  User,
  MediaFile,
  Prisma,
  $Enums,
} from "@prisma/client";

export const db = new PrismaClient();
