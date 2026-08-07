"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
const logger_js_1 = require("../config/logger.js");
function validate(schema) {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const details = error.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                    code: e.code,
                }));
                res.status(422).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details },
                });
                return;
            }
            logger_js_1.logger.error({ error }, 'Validation middleware error');
            res.status(500).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed' } });
        }
    };
}
//# sourceMappingURL=validate.js.map