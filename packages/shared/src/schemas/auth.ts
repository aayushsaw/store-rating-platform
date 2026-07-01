import { z } from 'zod';

// ─── Primitive validators ────────────────────────────────────────────────────

/** Min 12, Max 60 chars */
export const nameSchema = z
  .string({ required_error: 'Name is required' })
  .min(8, 'Name must be at least 8 characters')
  .max(60, 'Name must be at most 60 characters');

/** Max 400 chars */
export const addressSchema = z
  .string({ required_error: 'Address is required' })
  .min(1, 'Address is required')
  .max(400, 'Address must be at most 400 characters');

/**
 * 8–16 chars, at least one uppercase letter, at least one special character.
 */
export const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(16, 'Password must be at most 16 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(
    /[!@#$%^&*()_+\-={};':"\\|,.<>/?]/,
    'Password must contain at least one special character',
  );

export const emailSchema = z
  .string({ required_error: 'Email is required' })
  .email('Invalid email address')
  .max(255, 'Email must be at most 255 characters');

// ─── Auth schemas ─────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  address: addressSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Current password is required' })
      .min(1, 'Current password is required'),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// ─── Inferred types ───────────────────────────────────────────────────────────

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
