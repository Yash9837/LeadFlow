import { z } from 'zod';

// Enum schemas
export const citySchema = z.enum(['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other']);
export const propertyTypeSchema = z.enum(['Apartment', 'Villa', 'Plot', 'Office', 'Retail']);
export const bhkSchema = z.enum(['1', '2', '3', '4', 'Studio']);
export const purposeSchema = z.enum(['Buy', 'Rent']);
export const timelineSchema = z.enum(['0-3m', '3-6m', '>6m', 'Exploring']);
export const sourceSchema = z.enum(['Website', 'Referral', 'Walk-in', 'Call', 'Other']);
export const statusSchema = z.enum(['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped']);

// Base buyer schema
export const buyerSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(80, 'Full name must be 80 characters or less'),
  email: z
    .union([z.string().email('Invalid email address'), z.literal('')])
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  phone: z.string().min(1, 'Phone number is required').max(15, 'Phone number must be 15 characters or less'),
  city: citySchema,
  propertyType: propertyTypeSchema,
  bhk: z.union([bhkSchema, z.literal('')]).optional().transform((val) => (val === '' ? undefined : val)),
  purpose: purposeSchema,
  budgetMin: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (!val || val === '') return undefined;
    const num = typeof val === 'string' ? parseInt(val) : val;
    return isNaN(num) ? undefined : num;
  }),
  budgetMax: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (!val || val === '') return undefined;
    const num = typeof val === 'string' ? parseInt(val) : val;
    return isNaN(num) ? undefined : num;
  }),
  timeline: timelineSchema,
  source: sourceSchema,
  status: statusSchema.default('New'),
  notes: z
    .union([z.string().max(1000, 'Notes must be 1000 characters or less'), z.literal('')])
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  tags: z.array(z.string()).default([]),
}).refine((data) => {
  // BHK is required for Apartment and Villa
  if ((data.propertyType === 'Apartment' || data.propertyType === 'Villa') && !data.bhk) {
    return false;
  }
  return true;
}, {
  message: 'BHK is required for Apartment and Villa properties',
  path: ['bhk'],
}).refine((data) => {
  // Budget max should be greater than or equal to budget min
  if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
    return false;
  }
  return true;
}, {
  message: 'Maximum budget must be greater than or equal to minimum budget',
  path: ['budgetMax'],
}).refine((data) => {
  // Budget values should be positive if provided
  if (data.budgetMin !== undefined && data.budgetMin <= 0) {
    return false;
  }
  return true;
}, {
  message: 'Budget minimum must be positive',
  path: ['budgetMin'],
}).refine((data) => {
  // Budget values should be positive if provided
  if (data.budgetMax !== undefined && data.budgetMax <= 0) {
    return false;
  }
  return true;
}, {
  message: 'Budget maximum must be positive',
  path: ['budgetMax'],
});

// Schema for creating a new buyer (without id and timestamps)
export const createBuyerSchema = buyerSchema;

// Schema for the form (keeps budget fields as strings for form handling)
export const createBuyerFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(80, 'Full name must be 80 characters or less'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone number is required').max(15, 'Phone number must be 15 characters or less'),
  city: citySchema,
  propertyType: propertyTypeSchema,
  bhk: bhkSchema.optional().or(z.literal('')),
  purpose: purposeSchema,
  budgetMin: z.string().optional().or(z.literal('')),
  budgetMax: z.string().optional().or(z.literal('')),
  timeline: timelineSchema,
  source: sourceSchema,
  status: z.literal('New'),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional().or(z.literal('')),
  tags: z.array(z.string()),
}).refine((data) => {
  // BHK is required for Apartment and Villa
  if ((data.propertyType === 'Apartment' || data.propertyType === 'Villa') && !data.bhk) {
    return false;
  }
  return true;
}, {
  message: 'BHK is required for Apartment and Villa properties',
  path: ['bhk'],
}).refine((data) => {
  // Budget max should be greater than or equal to budget min
  const budgetMin = data.budgetMin ? parseInt(data.budgetMin) : undefined;
  const budgetMax = data.budgetMax ? parseInt(data.budgetMax) : undefined;
  
  if (budgetMin && budgetMax && budgetMax < budgetMin) {
    return false;
  }
  return true;
}, {
  message: 'Maximum budget must be greater than or equal to minimum budget',
  path: ['budgetMax'],
});

// Schema for updating a buyer (all fields optional except id)
export const updateBuyerSchema = buyerSchema.partial().extend({
  id: z.string().uuid('Invalid buyer ID'),
  updatedAt: z.string().optional(), // For optimistic concurrency control
});

// Schema for the update form (keeps budget fields as strings for form handling)
export const updateBuyerFormSchema = z.object({
  id: z.string().uuid('Invalid buyer ID'),
  updatedAt: z.string().optional(), // For optimistic concurrency control
  fullName: z.string().min(1, 'Full name is required').max(80, 'Full name must be 80 characters or less').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone number is required').max(15, 'Phone number must be 15 characters or less').optional(),
  city: citySchema.optional(),
  propertyType: propertyTypeSchema.optional(),
  bhk: bhkSchema.optional().or(z.literal('')),
  purpose: purposeSchema.optional(),
  budgetMin: z.string().optional().or(z.literal('')),
  budgetMax: z.string().optional().or(z.literal('')),
  timeline: timelineSchema.optional(),
  source: sourceSchema.optional(),
  status: z.enum(['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped']).optional(),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
}).refine((data) => {
  // Budget max should be greater than or equal to budget min
  const budgetMin = data.budgetMin ? parseInt(data.budgetMin) : undefined;
  const budgetMax = data.budgetMax ? parseInt(data.budgetMax) : undefined;
  
  if (budgetMin && budgetMax && budgetMax < budgetMin) {
    return false;
  }
  return true;
}, {
  message: 'Maximum budget must be greater than or equal to minimum budget',
  path: ['budgetMax'],
});

// Schema for CSV import
export const csvBuyerSchema = buyerSchema.omit({
  status: true, // Status defaults to 'New' for imports
  tags: true, // Tags can be empty for imports
});

// Type exports
export type BuyerFormData = z.infer<typeof buyerSchema>;
export type CreateBuyerData = z.infer<typeof createBuyerSchema>;
export type CreateBuyerFormData = z.infer<typeof createBuyerFormSchema>;
export type UpdateBuyerData = z.infer<typeof updateBuyerSchema>;
export type UpdateBuyerFormData = z.infer<typeof updateBuyerFormSchema>;
export type CSVBuyerData = z.infer<typeof csvBuyerSchema>;

// Utility function to validate budget constraints
export function validateBudgetConstraints(budgetMin?: number | null, budgetMax?: number | null): boolean {
  if (budgetMin && budgetMax && budgetMax < budgetMin) {
    return false;
  }
  return true;
}
