import { z } from 'zod';

const dateStrSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date in YYYY-MM-DD format');

const measurementsSchema = z
  .object({
    waistCm: z.number().positive().max(300).nullable().optional(),
    chestCm: z.number().positive().max(300).nullable().optional(),
    hipsCm: z.number().positive().max(300).nullable().optional(),
    armsCm: z.number().positive().max(300).nullable().optional(),
    thighsCm: z.number().positive().max(300).nullable().optional(),
  })
  .strict();

export const logWeightSchema = z.object({
  body: z
    .object({
      weightKg: z.number().positive().max(500),
      date: dateStrSchema.optional(),
      bodyFatPercent: z.number().min(0).max(100).nullable().optional(),
      measurements: measurementsSchema.nullable().optional(),
      note: z.string().max(500).nullable().optional(),
    })
    .strict(),
});

export const dateRangeQuerySchema = z.object({
  query: z.object({
    from: dateStrSchema.optional(),
    to: dateStrSchema.optional(),
  }),
});

export type LogWeightInput = z.infer<typeof logWeightSchema>['body'];
