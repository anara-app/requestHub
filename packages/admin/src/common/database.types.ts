import { RouterOutput } from "server/src/trpc/router";

export type {
  PrismaClient,
  User,
  MediaFile,
  Prisma,
  $Enums,
} from "server/src/common/prisma";

export type LanguageType =
  RouterOutput["admin"]["languages"]["getLanguages"][0];
export type UserType = RouterOutput["admin"]["users"]["getUsers"]["users"][0];
