"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.createChildLogger = createChildLogger;
const pino_1 = __importDefault(require("pino"));
const env_js_1 = require("./env.js");
const { LOG_LEVEL } = (0, env_js_1.getEnv)();
exports.logger = (0, pino_1.default)({
    level: LOG_LEVEL,
    transport: process.env.NODE_ENV !== 'production' ? {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
    } : undefined,
    formatters: {
        level: (label) => ({ level: label }),
    },
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
    base: undefined,
});
function createChildLogger(bindings) {
    return exports.logger.child(bindings);
}
//# sourceMappingURL=logger.js.map