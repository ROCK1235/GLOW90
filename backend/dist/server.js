"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_js_1 = require("./config/env.js");
const db_js_1 = require("./config/db.js");
const logger_js_1 = require("./config/logger.js");
const index_js_1 = require("./jobs/index.js");
const app_js_1 = require("./app.js");
async function bootstrap() {
    const env = (0, env_js_1.loadEnv)();
    await (0, db_js_1.connectDB)();
    logger_js_1.logger.info('Database connected successfully');
    (0, index_js_1.registerAllJobs)();
    (0, index_js_1.startJobs)();
    const app = (0, app_js_1.createApp)();
    const server = app.listen(env.PORT, () => {
        logger_js_1.logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started successfully');
    });
    const shutdown = async (signal) => {
        logger_js_1.logger.info({ signal }, 'Shutting down gracefully...');
        (0, index_js_1.stopJobs)();
        server.close(async () => {
            await (0, db_js_1.disconnectDB)();
            logger_js_1.logger.info('Server shutdown complete');
            process.exit(0);
        });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}
bootstrap().catch((error) => {
    logger_js_1.logger.error({ error }, 'Bootstrap failed');
    process.exit(1);
});
//# sourceMappingURL=server.js.map