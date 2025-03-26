import { FastifyReply, FastifyRequest } from "fastify";
import { verifyJWT } from "./jwt";

export const authGuard = async (
  request: FastifyRequest,
  reply: FastifyReply,
  next: any
) => {
  const token = request.headers?.authorization;
  if (token) {
    const decoded = verifyJWT(token);
    if (!decoded) return reply.unauthorized("Invalid token");
    return next();
  } else {
    return reply.unauthorized();
  }
};
