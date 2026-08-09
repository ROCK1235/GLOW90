import { z } from 'zod';

const dateStrSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date in YYYY-MM-DD format');

export const logWaterSchema = z.object({
  body: z
    .object({
      amountMl: z.number().positive().max(5000),
      date: dateStrSchema.optional(),
    })
    .strict(),
});

export const dateRangeQuerySchema = z.object({
  query: z.object({
    from: dateStrSchema.optional(),
    to: dateStrSchema.optional(),
  }),
});

export const summaryQuerySchema = z.object({
  query: z.object({
    date: dateStrSchema.optional(),
  }),
});

export type LogWaterInput = z.infer<typeof logWaterSchema>['body'];
