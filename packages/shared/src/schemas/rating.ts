import { z } from 'zod';

export const submitRatingSchema = z.object({
  value: z
    .number({
      required_error: 'Rating value is required',
      invalid_type_error: 'Rating value must be a number',
    })
    .int('Rating value must be an integer')
    .min(1, 'Rating must be at least 1 star')
    .max(5, 'Rating cannot be more than 5 stars'),
  comment: z
    .string()
    .max(1000, 'Review comment must be under 1000 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
});

export type SubmitRatingInput = z.infer<typeof submitRatingSchema>;
