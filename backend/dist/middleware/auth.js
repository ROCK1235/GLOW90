"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
const logger_js_1 = require("../config/logger.js");
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } });
        return;
    }
    const token = authHeader.slice(7);
    const { JWT_ACCESS_SECRET } = (0, env_js_1.getEnv)();
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_ACCESS_SECRET);
        req.user = payload;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ success: false, error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' } });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid access token' } });
            return;
        }
        logger_js_1.logger.error({ error }, 'Auth middleware error');
        res.status(500).json({ success: false, error: { code: 'AUTH_ERROR', message: 'Authentication failed' } });
    }
}
function optionalAuthMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        next();
        return;
    }
    const token = authHeader.slice(7);
    const { JWT_ACCESS_SECRET } = (0, env_js_1.getEnv)();
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_ACCESS_SECRET);
        req.user = payload;
    }
    catch {
        // Ignore errors for optional auth
    }
    next();
}
//# sourceMappingURL=auth.js.map