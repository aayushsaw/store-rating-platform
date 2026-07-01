import { z } from 'zod';
import { nameSchema, emailSchema, addressSchema, passwordSchema } from './auth.js';
import { UserRole } from '../constants.js';

export const adminCreateUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  address: addressSchema,
  password: passwordSchema,
  role: z.enum([UserRole.SYSTEM_ADMIN, UserRole.NORMAL_USER], {
    required_error: 'Role must be SYSTEM_ADMIN or NORMAL_USER',
  }),
});

export const userQuerySchema = z.object({
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
  role: z.nativeEnum(UserRole).optional(),
  status: z.enum(['active', 'deleted', 'all']).optional().default('active'),
  sortBy: z.enum(['name', 'email', 'address', 'role', 'createdAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
