import { z } from 'zod';

const dateStrSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date in YYYY-MM-DD format');
const timeStrSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected time in HH:mm format');
const daysOfWeekSchema = z.array(z.number().int().min(0).max(6)).max(7);
const dosageUnitSchema = z.enum(['mg', 'mcg', 'g', 'ml', 'iu', 'tablet', 'capsule', 'drop']);

export const createSupplementSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(100),
      dosageAmount: z.number().positive(),
      dosageUnit: dosageUnitSchema,
      notes: z.string().max(500).nullable().optional(),
      daysOfWeek: daysOfWeekSchema.optional(),
      times: z.array(timeStrSchema).min(1).max(10).optional(),
    })
    .strict(),
});

export const updateSupplementSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(100).optional(),
      dosageAmount: z.number().positive().optional(),
      dosageUnit: dosageUnitSchema.optional(),
      notes: z.string().max(500).nullable().optional(),
      daysOfWeek: daysOfWeekSchema.optional(),
      times: z.array(timeStrSchema).min(1).max(10).optional(),
    })
    .strict(),
});

export const logDoseSchema = z.object({
  body: z
    .object({
      date: dateStrSchema.optional(),
      time: timeStrSchema.optional(),
    })
    .strict(),
});

export const listSupplementsQuerySchema = z.object({
  query: z.object({
    includeArchived: z.enum(['true', 'false']).optional(),
  }),
});

export const dateRangeQuerySchema = z.object({
  query: z
    .object({
      from: dateStrSchema.optional(),
      to: dateStrSchema.optional(),
    })
    .refine(
      ({ from, to }) => {
        if (!from || !to) return true;
        const days = (Date.parse(to) - Date.parse(from)) / (24 * 60 * 60 * 1000);
        return days >= 0 && days <= 400;
      },
      { message: 'Date range must be between 0 and 400 days' }
    ),
});

export type CreateSupplementInput = z.infer<typeof createSupplementSchema>['body'];
export type UpdateSupplementInput = z.infer<typeof updateSupplementSchema>['body'];
