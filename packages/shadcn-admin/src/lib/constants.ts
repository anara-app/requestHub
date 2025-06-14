export const ENV_KEYS = {
  TRPC_URL: (import.meta.env.VITE_TRPC_URL ||
    "http://localhost:8080/trpc") as string,
  REST_API_URL: (import.meta.env.VITE_REST_API_URL ||
    "http://localhost:8080/api") as string,

  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || "",

  WEB_CLIENT_URL: import.meta.env.VITE_CLIENT_URL || "http://localhost:3000",

  WS_URL: import.meta.env.VITE_WS_URL || "http://localhost:8081",
};

export const API_URL = {
  UPLOAD_MEDIA: ENV_KEYS.REST_API_URL.concat("/media"),
  UPLOAD_MEDIA_MANAGER: ENV_KEYS.REST_API_URL.concat("/media-manager"),
};

export const DEFAULT_DATE_FORMAT = " HH:mm dd/MM/yyyy";
export const DEFAULT_DATE_PICKER_FORMAT = "DD/MM/YYYY";
