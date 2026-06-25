import * as process from 'node:process';
import 'dotenv/config';
import { z } from 'zod';

const MIN_SECRET_LENGTH = 32;

const secret = (label: string) =>
  z
    .string()
    .min(
      MIN_SECRET_LENGTH,
      `${label} must be at least ${MIN_SECRET_LENGTH} characters. ` +
        `Generate one with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`,
    );

const envSchema = z.object({
  NODE_ENV: z.string().default('production'),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
  CLIENT_URL: z.string().url().default('http://localhost:3001'),

  JWT_ACCESS_SECRET: secret('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: secret('JWT_REFRESH_SECRET'),
  JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET: secret(
    'JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET',
  ),
  JWT_ROOM_MEMBER_TOKEN_SECRET: secret('JWT_ROOM_MEMBER_TOKEN_SECRET'),

  JWT_ACCESS_TTL: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 15),
  JWT_REFRESH_TTL: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24 * 2),

  EMAIL_HOST: z.string().min(1),
  EMAIL_PORT: z.coerce.number().int().positive(),
  EMAIL_USER: z.string().min(1),
  EMAIL_PASSWORD: z.string().min(1),
  // Envelope "From". Must be an address on a domain verified with the SMTP
  // provider (e.g. @auctionshub.net for SES) or the provider rejects the mail.
  // Treat an empty value (e.g. an unset ${EMAIL_FROM} in docker-compose) as
  // missing so it falls back to the default instead of failing validation.
  EMAIL_FROM: z.preprocess(
    (v) => (v === '' ? undefined : v),
    z.string().min(1).default('AuctionHub <no-reply@auctionshub.net>'),
  ),

  // Optional: when omitted, the AWS SDK falls back to the default credential
  // provider chain (EC2 instance IAM role via IMDS). Set explicitly only for
  // local/dev (MinIO) or non-role environments.
  STORAGE_ACCESS_KEY: z.string().min(1).optional(),
  STORAGE_SECRET_KEY: z.string().min(1).optional(),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_ENDPOINT: z.string().min(1),
  STORAGE_REGION: z.string().min(1),
  STORAGE_PUBLIC_URL: z.string().min(1),
  // Browser-reachable endpoint for presigned PUT uploads.
  // MinIO: same host as STORAGE_PUBLIC_URL. S3: the bucket's S3 endpoint
  // (uploads go to S3 directly, NOT through the CloudFront public URL).
  STORAGE_UPLOAD_URL: z.string().min(1).optional(),
  // 'true' for MinIO (path-style), 'false' for AWS S3 (virtual-hosted). Defaults to true.
  STORAGE_FORCE_PATH_STYLE: z.string().optional(),

  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment variables:\n${formatted}`);
}

const env = parsed.data;

interface AppConfigInterface {
  ENV: string;

  // env urls
  DATABASE_URL: string;
  REDIS_URL: string;
  PORT: number;
  CLIENT_URL: string;

  // token secrets
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET: string;
  JWT_ROOM_MEMBER_TOKEN_SECRET: string;

  // ttls
  JWT_ROOM_MEMBER_INVITE_TOKEN_TTL: number;
  JWT_ROOM_TTL: number;
  JWT_ACCESS_TTL: number;
  JWT_REFRESH_TTL: number;

  // email settings
  EMAIL_HOST: string;
  EMAIL_PORT: number;
  EMAIL_USER: string;
  EMAIL_PASSWORD: string;
  EMAIL_FROM: string;

  // storage settings
  STORAGE_ACCESS_KEY?: string;
  STORAGE_SECRET_KEY?: string;
  STORAGE_BUCKET: string;
  STORAGE_ENDPOINT: string;
  STORAGE_REGION: string;
  STORAGE_PUBLIC_URL: string;
  STORAGE_UPLOAD_URL?: string;
  STORAGE_FORCE_PATH_STYLE?: string;

  // google oauth
  GOOGLE_CLIENT_ID: string;
}

const AppConfig: AppConfigInterface = {
  ENV: env.NODE_ENV,

  DATABASE_URL: env.DATABASE_URL,
  REDIS_URL: env.REDIS_URL,
  PORT: env.PORT,
  CLIENT_URL: env.CLIENT_URL,

  JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
  JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET: env.JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET,
  JWT_ROOM_MEMBER_TOKEN_SECRET: env.JWT_ROOM_MEMBER_TOKEN_SECRET,

  JWT_ACCESS_TTL: env.JWT_ACCESS_TTL,
  JWT_REFRESH_TTL: env.JWT_REFRESH_TTL,
  JWT_ROOM_MEMBER_INVITE_TOKEN_TTL: 60 * 30,
  JWT_ROOM_TTL: 60 * 60 * 24 * 1,

  EMAIL_HOST: env.EMAIL_HOST,
  EMAIL_PORT: env.EMAIL_PORT,
  EMAIL_USER: env.EMAIL_USER,
  EMAIL_PASSWORD: env.EMAIL_PASSWORD,
  EMAIL_FROM: env.EMAIL_FROM,

  STORAGE_ACCESS_KEY: env.STORAGE_ACCESS_KEY,
  STORAGE_SECRET_KEY: env.STORAGE_SECRET_KEY,
  STORAGE_BUCKET: env.STORAGE_BUCKET,
  STORAGE_ENDPOINT: env.STORAGE_ENDPOINT,
  STORAGE_REGION: env.STORAGE_REGION,
  STORAGE_PUBLIC_URL: env.STORAGE_PUBLIC_URL,
  STORAGE_UPLOAD_URL: env.STORAGE_UPLOAD_URL,
  STORAGE_FORCE_PATH_STYLE: env.STORAGE_FORCE_PATH_STYLE,

  GOOGLE_CLIENT_ID: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
};

export { AppConfig, AppConfigInterface };
