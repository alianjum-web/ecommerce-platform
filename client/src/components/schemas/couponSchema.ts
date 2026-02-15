// src/schemas/couponSchema.ts
import { z } from 'zod';

export const couponFormSchema = z.object({
  code: z.string()
    .min(3, 'Code must be at least 3 characters')
    .max(20, 'Code must be at most 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens'),
  
  discountPercent: z.number()
    .min(1, 'Discount must be at least 1%')
    .max(100, 'Discount cannot exceed 100%'),
  
  startDate: z.string()
    .min(1, 'Start date is required')
    .refine(date => !isNaN(Date.parse(date)), 'Invalid date format'),
  
  endDate: z.string()
    .min(1, 'End date is required')
    .refine(date => !isNaN(Date.parse(date)), 'Invalid date format'),
  
  usageLimit: z.number()
    .min(0, 'Usage limit cannot be negative')
    .max(10000, 'Usage limit cannot exceed 10,000')
}).refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

export type CouponFormSchema = z.infer<typeof couponFormSchema>;