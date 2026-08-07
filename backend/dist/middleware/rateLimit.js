"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.generalRateLimiter = void 0;
exports.getGeneralRateLimiter = getGeneralRateLimiter;
exports.getAuthRateLimiter = getAuthRateLimiter;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_js_1 = require("../config/env.js");
let generalLimiterInstance = null;
let authLimiterInstance = null;
function getGeneralRateLimiter() {
    if (!generalLimiterInstance) {
        const env = (0, env_js_1.getEnv)();
        generalLimiterInstance = (0, express_rate_limit_1.default)({
            windowMs: env.RATE_LIMIT_WINDOW_MS,
            max: env.RATE_LIMIT_MAX_REQUESTS,
            standardHeaders: true,
            legacyHeaders: false,
            validate: false,
            message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later' } },
            keyGenerator: (req) => req.ip ?? 'unknown',
        });
    }
    return generalLimiterInstance;
}
function getAuthRateLimiter() {
    if (!authLimiterInstance) {
        const env = (0, env_js_1.getEnv)();
        authLimiterInstance = (0, express_rate_limit_1.default)({
            windowMs: env.RATE_LIMIT_WINDOW_MS,
            max: env.AUTH_RATE_LIMIT_MAX,
            standardHeaders: true,
            legacyHeaders: false,
            validate: false,
            message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many authentication attempts, please try again later' } },
            keyGenerator: (req) => req.ip ?? 'unknown',
        });
    }
    return authLimiterInstance;
}
const generalRateLimiter = (req, res, next) => {
    if (process.env.NODE_ENV === 'test')
        return next();
    getGeneralRateLimiter()(req, res, next);
};
exports.generalRateLimiter = generalRateLimiter;
const authRateLimiter = (req, res, next) => {
    if (process.env.NODE_ENV === 'test')
        return next();
    getAuthRateLimiter()(req, res, next);
};
exports.authRateLimiter = authRateLimiter;
//# sourceMappingURL=rateLimit.js.map