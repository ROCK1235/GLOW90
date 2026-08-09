"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
exports.getEnv = getEnv;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// import dotenv from 'dotenv';
// import path from 'path';
const zod_1 = require("zod");
dotenv_1.default.config({
    path: path_1.default.resolve(process.cwd(), '.env'),
});
const result = dotenv_1.default.config({
    path: path_1.default.resolve(process.cwd(), ".env"),
});
console.log("Dotenv result:", result);
console.log("Working Directory:", process.cwd());
console.log("JWT_ACCESS_SECRET:", process.env.JWT_ACCESS_SECRET);
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(4000),
    MONGODB_URI: zod_1.z
        .string()
        .regex(/^mongodb(\+srv)?:\/\//, 'Invalid MongoDB URI')
        .default('mongodb://localhost:27017/glowtrack'),
    JWT_ACCESS_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_ACCESS_EXPIRY: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRY: zod_1.z.string().default('30d'),
    GOOGLE_CLIENT_IDS: zod_1.z.string().optional().default(''),
    APPLE_CLIENT_ID: zod_1.z.string().optional().default(''),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:8081'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(60000),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.coerce.number().default(120),
    AUTH_RATE_LIMIT_MAX: zod_1.z.coerce.number().default(5),
    LOG_LEVEL: zod_1.z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    AI_MODEL: zod_1.z.string().default('google/gemma-4-31b-it:free'),
    AI_FALLBACK_MODELS: zod_1.z.string().default('google/gemma-4-26b-a4b-it:free,poolside/laguna-xs-2.1:free'),
    OPENROUTER_API_KEY: zod_1.z.string().optional().default(''),
    OPENROUTER_BASE_URL: zod_1.z.string().default('https://openrouter.ai/api/v1'),
});
let env;
function loadEnv() {
    if (env)
        return env;
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
function getEnv() {
    if (!env)
        return loadEnv();
    return env;
}
//# sourceMappingURL=env.js.map