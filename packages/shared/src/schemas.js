"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorResponseSchema = exports.ApiResponseSchema = exports.PaginationSchema = exports.FrequencySchema = exports.LocalDateSchema = exports.ObjectIdSchema = void 0;
const zod_1 = require("zod");
exports.ObjectIdSchema = zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
exports.LocalDateSchema = zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid local date format (YYYY-MM-DD)');
exports.FrequencySchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({ type: zod_1.z.literal('daily') }),
    zod_1.z.object({ type: zod_1.z.literal('weekdays'), days: zod_1.z.array(zod_1.z.number().int().min(0).max(6)).min(1).max(7) }),
    zod_1.z.object({ type: zod_1.z.literal('times_per_week'), count: zod_1.z.number().int().min(1).max(7) }),
    zod_1.z.object({ type: zod_1.z.literal('every_n_days'), n: zod_1.z.number().int().min(1), anchorDate: exports.LocalDateSchema.optional() }),
]);
exports.PaginationSchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    cursor: zod_1.z.string().optional(),
});
const ApiResponseSchema = (dataSchema) => zod_1.z.object({
    success: zod_1.z.boolean(),
    data: dataSchema.optional(),
    meta: zod_1.z.object({ cursor: zod_1.z.string().optional(), hasMore: zod_1.z.boolean() }).optional(),
    error: zod_1.z
        .object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.array(zod_1.z.unknown()).optional(),
    })
        .optional(),
});
exports.ApiResponseSchema = ApiResponseSchema;
exports.ErrorResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(false),
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.array(zod_1.z.unknown()).optional(),
    }),
});
//# sourceMappingURL=schemas.js.map