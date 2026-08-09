import { z } from 'zod';

const dateStrSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date in YYYY-MM-DD format');
const timeStrSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected time in HH:mm format');
const daysOfWeekSchema = z.array(z.number().int().min(0).max(6)).max(7);

export const createHabitSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(100),
      icon: z.string().max(50).nullable().optional(),
      daysOfWeek: daysOfWeekSchema.optional(),
      reminderTime: timeStrSchema.nullable().optional(),
    })
    .strict(),
});

export const updateHabitSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(100).optional(),
      icon: z.string().max(50).nullable().optional(),
      daysOfWeek: daysOfWeekSchema.optional(),
      reminderTime: timeStrSchema.nullable().optional(),
    })
    .strict(),
});

export const logCompletionSchema = z.object({
  body: z
    .object({
      date: dateStrSchema.optional(),
    })
    .strict(),
});

export const listHabitsQuerySchema = z.object({
  query: z.object({
    includeArchived: z.enum(['true', 'false']).optional(),
  }),
});

export const listLogsQuerySchema = z.object({
  query: z.object({
    from: dateStrSchema.optional(),
    to: dateStrSchema.optional(),
  }),
});

export type CreateHabitInput = z.infer<typeof createHabitSchema>['body'];
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>['body'];
