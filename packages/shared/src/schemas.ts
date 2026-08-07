import { z } from 'zod';

export const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const LocalDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid local date format (YYYY-MM-DD)');

export const FrequencySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('daily') }),
  z.object({ type: z.literal('weekdays'), days: z.array(z.number().int().min(0).max(6)).min(1).max(7) }),
  z.object({ type: z.literal('times_per_week'), count: z.number().int().min(1).max(7) }),
  z.object({ type: z.literal('every_n_days'), n: z.number().int().min(1), anchorDate: LocalDateSchema.optional() }),
]);

export type Frequency = z.infer<typeof FrequencySchema>;

export const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    meta: z.object({ cursor: z.string().optional(), hasMore: z.boolean() }).optional(),
    error: z
      .object({
        code: z.string(),
        message: z.string(),
        details: z.array(z.unknown()).optional(),
      })
      .optional(),
  });

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.unknown()).optional(),
  }),
});

export type ApiError = z.infer<typeof ErrorResponseSchema>['error'];