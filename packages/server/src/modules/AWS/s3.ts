import {
  GetObjectCommand,
  PutObjectCommand,
  PutObjectCommandInput,
  S3,
} from "@aws-sdk/client-s3";
import { MultipartFile } from "@fastify/multipart";
import { FileType } from "@prisma/client";
import { v4 as uuid } from "uuid";
import { CONSTANTS } from "../../common/constants";
import { db, MediaFile } from "../../common/prisma";

/* Config */
const BUCKET_NAME = CONSTANTS.AWS.BUCKET_NAME;
const s3Client = new S3({
  region: CONSTANTS.AWS.REGION,
  endpoint: CONSTANTS.AWS.ENDPOINT,
  forcePathStyle: false, // For DO, not needed for AWS
  credentials: {
    accessKeyId: CONSTANTS.AWS.S3_KEY!,
    secretAccessKey: CONSTANTS.AWS.S3_SECRET!,
  },
});

const streamToBuffer = (stream: any): Promise<Buffer> => {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: any) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err: any) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
};

/* Types */
interface UploadOptions {
  file?: MultipartFile;
  buffer?: Buffer;
  filename?: string;
  type?: FileType;
  mimetype?: string;
  altName?: string;
}

/* Main */
export class AWSManager {
  static getFilePath(fileName: string) {
    return `https://pub-93fd205f2bfa434a961448a647536716.r2.dev/assets/${fileName}`;
  }

  static async uploadFileToBucket({
    filename,
    file,
    type,
    buffer,
    mimetype,
    altName,
  }: UploadOptions): Promise<MediaFile | undefined> {
    const name = filename || file?.filename || `file-${Date.now()}`;
    const bucketFileName = `${Date.now()}-${uuid()}-${name}`;
    const bucketParams: PutObjectCommandInput = {
      Bucket: BUCKET_NAME,
      Key: `assets/${bucketFileName}`,
      Body: buffer || (await file?.toBuffer()),
      ContentType: mimetype || file?.mimetype || "image/png",
      ACL: "public-read", //For DO
    };
    try {
      await s3Client.send(new PutObjectCommand(bucketParams));
      const url = this.getFilePath(bucketFileName);
      return db.mediaFile.create({
        data: {
          filename: bucketFileName,
          originalFileName: file?.filename || "",
          url,
          type,
          altName,
        },
      });
    } catch (e) {
      console.log("Error", e);
      throw e;
    }
  }

  static async downloadFileFromBucket(
    fileName: string
  ): Promise<Buffer | undefined> {
    const bucketParams = {
      Bucket: BUCKET_NAME,
      Key: `assets/${fileName}`,
    };
    try {
      const response = await s3Client.send(new GetObjectCommand(bucketParams));
      return await streamToBuffer(response.Body);
    } catch (e) {
      console.log("Error", e);
      throw e;
    }
  }
}
