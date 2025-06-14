import jwt from "jsonwebtoken";
import { CONSTANTS } from "./constants";
import { User } from "@prisma/client";

export function verifyJWT(token: string) {
  const publicKey = CONSTANTS.JWT_KEY;
  try {
    return jwt.verify(token, publicKey) as { userId: string } | null;
  } catch (error) {
    return;
  }
}

export function createJWT(user: Partial<User>, expiresIn = "30d") {
  const privateKey = CONSTANTS.JWT_KEY;
  const payload = { userId: user.id };
  const options = { expiresIn };
  try {
    return jwt.sign(payload, privateKey, options);
  } catch (error) {
    console.error("Error creating JWT:", error);
    return null;
  }
}
