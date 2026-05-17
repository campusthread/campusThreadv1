import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const rawEnv = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  API_URL: process.env.API_URL,
  CLIENT_URL:
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    process.env.ALLOWED_ORIGINS?.split(",")[0]?.trim(),
  MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI,
  REDIS_URL: process.env.REDIS_URL,
  REDIS_ENABLED: process.env.REDIS_ENABLED,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  EMAIL_SERVICE: process.env.EMAIL_SERVICE,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER || process.env.EMAIL_USER,
  SMTP_PASS: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  DNS_SERVERS: process.env.DNS_SERVERS,
  TOTP_WINDOW: process.env.TOTP_WINDOW,
  TOTP_TIME_STEP: process.env.TOTP_TIME_STEP,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
};

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  MONGO_URI: z.string().default("mongodb://127.0.0.1:27017/miggle"),
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  REDIS_ENABLED: z
    .string()
    .optional()
    .transform((value) => value !== "false"),
  JWT_SECRET: z.string().min(8).default("change-me"),
  JWT_EXPIRES_IN: z.string().default("30d"),
  REFRESH_TOKEN_SECRET: z.string().optional(),
  REFRESH_TOKEN_EXPIRE: z.string().optional(),
  API_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  PAYSTACK_PUBLIC_KEY: z.string().optional(),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  EMAIL_SERVICE: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("no-reply@miggle.local"),
  ALLOWED_ORIGINS: z.string().optional(),
  DNS_SERVERS: z.string().optional(),
  TOTP_WINDOW: z.coerce.number().optional(),
  TOTP_TIME_STEP: z.coerce.number().optional(),
  ADMIN_EMAIL: z.string().optional(),
});

const parsed = envSchema.parse(rawEnv);

export const env = {
  nodeEnv: parsed.NODE_ENV,
  isDevelopment: parsed.NODE_ENV === "development",
  isProduction: parsed.NODE_ENV === "production",
  port: parsed.PORT,
  apiUrl: parsed.API_URL,
  clientUrl: parsed.CLIENT_URL,
  allowedOrigins: parsed.ALLOWED_ORIGINS
    ? parsed.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [parsed.CLIENT_URL],
  mongoUri: parsed.MONGO_URI,
  redisUrl: parsed.REDIS_URL,
  redisEnabled: parsed.REDIS_ENABLED,
  jwtSecret: parsed.JWT_SECRET,
  jwtExpiresIn: parsed.JWT_EXPIRES_IN,
  refreshTokenSecret: parsed.REFRESH_TOKEN_SECRET,
  refreshTokenExpire: parsed.REFRESH_TOKEN_EXPIRE,
  cloudinary: {
    cloudName: parsed.CLOUDINARY_CLOUD_NAME,
    apiKey: parsed.CLOUDINARY_API_KEY,
    apiSecret: parsed.CLOUDINARY_API_SECRET,
  },
  paystack: {
    publicKey: parsed.PAYSTACK_PUBLIC_KEY,
    secretKey: parsed.PAYSTACK_SECRET_KEY,
  },
  emailService: parsed.EMAIL_SERVICE,
  smtp: {
    host: parsed.SMTP_HOST,
    port: parsed.SMTP_PORT,
    user: parsed.SMTP_USER,
    pass: parsed.SMTP_PASS,
    from: parsed.EMAIL_FROM,
  },
  dnsServers: parsed.DNS_SERVERS
    ? parsed.DNS_SERVERS.split(",").map((server) => server.trim()).filter(Boolean)
    : ["1.1.1.1", "8.8.8.8"],
  totp: {
    window: parsed.TOTP_WINDOW,
    timeStep: parsed.TOTP_TIME_STEP,
  },
  adminEmail: parsed.ADMIN_EMAIL,
};
