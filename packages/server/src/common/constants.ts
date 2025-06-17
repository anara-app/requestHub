export const CONSTANTS = {
  API_PORT: process.env.PORT || 8080,
  WEB_CLIENT_URL: process.env.WEB_CLIENT_URL || "http://localhost:3000",
  JWT_KEY: process.env.JWT_KEY || "secret",

  RESEND_API_KEY: process.env.RESEND_API_KEY || "",

  //AWS env vars
  AWS: {
    BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME!,
    ENDPOINT: process.env.AWS_S3_ENDPOINT!,
    REGION: process.env.AWS_S3_REGION!,
    S3_KEY: process.env.AWS_S3_KEY!,
    S3_SECRET: process.env.AWS_S3_SECRET!,
  },

  //CLOUDFLARE
  CLOUDFLARE: {
    ZONE_ID: process.env.CLOUDFLARE_ZONE_ID!,
    API_TOKEN: process.env.CLOUDFLARE_API_TOKEN!,
  },

  //Resend
  RESEND: {
    API_KEY: process.env.RESEND_API_KEY!,
  },
};
