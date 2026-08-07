"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.notFoundHandler = notFoundHandler;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_js_1 = require("../config/logger.js");
class AppError extends Error {
    code;
    statusCode;
    details;
    constructor(code, message, statusCode = 500, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function errorHandler(err, req, res, next) {
    logger_js_1.logger.error({ err, path: req.path, method: req.method }, 'Request error');
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: { code: err.code, message: err.message, details: err.details },
        });
        return;
    }
    if (err instanceof mongoose_1.default.Error.ValidationError) {
        const details = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
            code: 'VALIDATION_ERROR',
        }));
        res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details } });
        return;
    }
    if (err instanceof mongoose_1.default.Error.CastError) {
        res.status(400).json({ success: false, error: { code: 'INVALID_ID', message: 'Invalid ID format' } });
        return;
    }
    if (err.name === 'MongoServerError' && err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        res.status(409).json({ success: false, error: { code: 'DUPLICATE_ENTRY', message: `${field} already exists` } });
        return;
    }
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
}
function notFoundHandler(req, res) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
}
//# sourceMappingURL=errorHandler.js.map