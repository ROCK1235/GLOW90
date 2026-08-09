"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const env_js_1 = require("../config/env.js");
const db_js_1 = require("../config/db.js");
const authService_js_1 = require("../modules/auth/service/authService.js");
const authRepository_js_1 = require("../modules/auth/repository/authRepository.js");
const logger_js_1 = require("../config/logger.js");
async function seed() {
    (0, env_js_1.loadEnv)();
    await (0, db_js_1.connectDB)();
    logger_js_1.logger.info('Seeding database...');
    const seedEmail = 'demo@glowtrack.app';
    const existingUser = await authRepository_js_1.authRepository.findUserByEmail(seedEmail);
    if (existingUser) {
        logger_js_1.logger.info({ email: seedEmail }, 'Seed user already exists, skipping creation');
    }
    else {
        const result = await authService_js_1.authService.register({
            email: seedEmail,
            password: 'Password123!',
            name: 'GlowTrack Demo User',
        });
        logger_js_1.logger.info({ userId: result.user._id }, 'Seed user created successfully');
    }
    await (0, db_js_1.disconnectDB)();
    logger_js_1.logger.info('Database seed complete');
}
seed().catch((error) => {
    logger_js_1.logger.error({ error }, 'Database seed failed');
    process.exit(1);
});
//# sourceMappingURL=seed.js.map