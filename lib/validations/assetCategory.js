import { z } from 'zod';

export const assetCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Category name must be at least 2 characters')
    .max(60, 'Category name must be under 60 characters'),
});