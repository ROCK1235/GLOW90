import { z } from 'zod';

const dateStrSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date in YYYY-MM-DD format');
const daysOfWeekSchema = z.array(z.number().int().min(0).max(6)).max(7);
const timeOfDaySchema = z.enum(['AM', 'PM', 'anytime']);

const stepInputSchema = z
  .object({
    name: z.string().min(1).max(100),
    product: z.string().max(100).nullable().optional(),
  })
  .strict();

export const createRoutineSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(100),
      timeOfDay: timeOfDaySchema.optional(),
      steps: z.array(stepInputSchema).min(1).max(20),
      daysOfWeek: daysOfWeekSchema.optional(),
    })
    .strict(),
});

export const updateRoutineSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(100).optional(),
      timeOfDay: timeOfDaySchema.optional(),
      steps: z.array(stepInputSchema).min(1).max(20).optional(),
      daysOfWeek: daysOfWeekSchema.optional(),
    })
    .strict(),
});

export const logRoutineSchema = z.object({
  body: z
    .object({
      date: dateStrSchema.optional(),
      completedSteps: z.array(z.number().int().positive()).optional(),
    })
    .strict(),
});

export const listRoutinesQuerySchema = z.object({
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

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>['body'];
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>['body'];
