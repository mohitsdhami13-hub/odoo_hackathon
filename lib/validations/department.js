import { z } from 'zod';

export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Department name must be at least 2 characters')
    .max(60, 'Department name must be under 60 characters'),
  headId: z.string().cuid().nullable().optional(),
});

// Used for PATCH — every field optional, plus isActive for deactivate/reactivate
export const departmentUpdateSchema = departmentSchema.partial().extend({
  isActive: z.boolean().optional(),
});