import { z } from 'zod';
import { nameSchema, emailSchema, addressSchema, passwordSchema } from './auth.js';

export const createStoreWithOwnerSchema = z.object({
  store: z.object({
    name: z
      .string({ required_error: 'Store name is required' })
      .min(1, 'Store name is required')
      .max(255, 'Store name must be at most 255 characters'),
    email: emailSchema,
    address: addressSchema,
  }),
  owner: z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    address: addressSchema,
  }),
});

export const storeQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }),
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 10 : parsed;
    }),
  search: z.string().optional(),
  sortBy: z
    .enum(['name', 'email', 'address', 'overallRating', 'createdAt'])
    .optional()
    .default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateStoreWithOwnerInput = z.infer<typeof createStoreWithOwnerSchema>;
export type StoreQueryInput = z.infer<typeof storeQuerySchema>;
