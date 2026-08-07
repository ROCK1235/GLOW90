"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
exports.getConnectionStatus = getConnectionStatus;
const mongoose_1 = __importDefault(require("mongoose"));
const env_js_1 = require("./env.js");
const logger_js_1 = require("./logger.js");
async function connectDB() {
    if (mongoose_1.default.connection.readyState === 1)
        return;
    const { MONGODB_URI } = (0, env_js_1.getEnv)();
    try {
        mongoose_1.default.set('strictQuery', true);
        await mongoose_1.default.connect(MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        });
        logger_js_1.logger.info({ uri: MONGODB_URI.replace(/\/\/.*@/, '//****:****@') }, 'MongoDB connected');
    }
    catch (error) {
        logger_js_1.logger.error({ error }, 'MongoDB connection failed');
        throw error;
    }
}
async function disconnectDB() {
    if (mongoose_1.default.connection.readyState === 0)
        return;
    await mongoose_1.default.disconnect();
    logger_js_1.logger.info('MongoDB disconnected');
}
function getConnectionStatus() {
    return mongoose_1.default.connection.readyState === 1;
}
//# sourceMappingURL=db.js.map