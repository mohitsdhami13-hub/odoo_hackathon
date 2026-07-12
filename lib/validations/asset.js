import { z } from 'zod';

export const assetSchema = z.object({
  name: z.string().trim().min(2, 'Asset name must be at least 2 characters').max(120),
  categoryId: z.string().cuid('Select a category'),
  serialNumber: z.string().trim().max(100).optional().or(z.literal('')),
  acquisitionDate: z.coerce.date().optional(),
  acquisitionCost: z.coerce.number().nonnegative().optional(),
  condition: z.string().trim().max(100).optional().or(z.literal('')),
  location: z.string().trim().max(100).optional().or(z.literal('')),
  isBookable: z.boolean().default(false),
});

// PATCH — every field optional. assetTag and status are deliberately never
// editable here: the tag is server-generated once at creation, and status
// only changes via the allocation/booking/maintenance workflows, not by
// direct edit — otherwise an admin could silently desync status from reality.
export const assetUpdateSchema = assetSchema.partial();