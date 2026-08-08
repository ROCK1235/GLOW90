import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(100).optional(),
      avatarUrl: z.string().url().nullable().optional(),
      dateOfBirth: z.coerce.date().nullable().optional(),
      sex: z.enum(['male', 'female', 'other']).nullable().optional(),
      heightCm: z.number().positive().max(300).nullable().optional(),
      timezone: z.string().min(1).optional(),
      locale: z.string().min(1).optional(),
      units: z.enum(['metric', 'imperial']).optional(),
      goals: z
        .object({
          type: z.enum(['weight_loss', 'muscle_gain', 'maintenance']),
          targetWeightKg: z.number().positive().nullable().optional(),
          targetDate: z.coerce.date().nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .strict(),
});

export const updateSettingsSchema = z.object({
  body: z
    .object({
      theme: z.enum(['system', 'light', 'dark']).optional(),
      notifications: z
        .object({
          general: z.boolean().optional(),
        })
        .strict()
        .optional(),
    })
    .strict(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>['body'];
