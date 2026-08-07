import dotenv from "dotenv";
import path from "path";


// import dotenv from 'dotenv';
// import path from 'path';
import { z } from 'zod';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});
const result = dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

console.log("Dotenv result:", result);
console.log("Working Directory:", process.cwd());
console.log("JWT_ACCESS_SECRET:", process.env.JWT_ACCESS_SECRET);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z
    .string()
    .regex(/^mongodb(\+srv)?:\/\//, 'Invalid MongoDB URI')
    .default('mongodb://localhost:27017/glowtrack'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  CORS_ORIGIN: z.string().default('http://localhost:8081'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(120),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(5),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  AI_MODEL: z.string().default('google/gemma-4-31b-it:free'),
  AI_FALLBACK_MODELS: z.string().default('google/gemma-4-26b-a4b-it:free,poolside/laguna-xs-2.1:free'),
  OPENROUTER_API_KEY: z.string().optional().default(''),
  OPENROUTER_BASE_URL: z.string().default('https://openrouter.ai/api/v1'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function loadEnv(): Env {
  if (env) return env;
  if (process.env.NODE_ENV === 'test') {
    process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_jwt_access_secret_32_chars_long!';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_jwt_refresh_secret_32_chars_long!';
    process.env.RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || '1000';
    process.env.AUTH_RATE_LIMIT_MAX = process.env.AUTH_RATE_LIMIT_MAX || '1000';
  }
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    process.exit(1);
  }
  env = result.data;
  return env;
}

export function getEnv(): Env {
  if (!env) return loadEnv();
  return env;
}