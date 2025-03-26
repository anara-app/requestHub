import { FastifyInstance } from "fastify";
import { AWSManager } from "../modules/AWS/s3";
import { FileType } from "@prisma/client";
import { generateSlug } from "../common/utils";

// /api/media
export function mediaRouter(fastify: FastifyInstance, opts: any, done: any) {
  fastify.post("", { preHandler: [] }, async (request, reply) => {
    const file = await request.file();

    const query = request.query as { type?: string; altName?: string };
    if (!file) return reply.badRequest("No file found");

    return await AWSManager.uploadFileToBucket({
      filename: generateSlug(file?.filename.trim()),
      altName: query.altName,
      type: (query?.type as FileType) || undefined,
      file,
    });
  });

  done();
}
