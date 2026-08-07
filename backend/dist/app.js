"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const env_js_1 = require("./config/env.js");
const rateLimit_js_1 = require("./middleware/rateLimit.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const authRoutes_js_1 = __importDefault(require("./modules/auth/routes/authRoutes.js"));
function createApp() {
    const app = (0, express_1.default)();
    const env = (0, env_js_1.getEnv)();
    // Security & standard middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({
        origin: env.CORS_ORIGIN,
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use(rateLimit_js_1.generalRateLimiter);
    // Health check route
    app.get('/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    // API Routes
    app.use('/api/v1/auth', authRoutes_js_1.default);
    // 404 & Error handlers
    app.use(errorHandler_js_1.notFoundHandler);
    app.use(errorHandler_js_1.errorHandler);
    return app;
}
exports.app = createApp();
//# sourceMappingURL=app.js.map