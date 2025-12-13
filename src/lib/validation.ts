import { z } from 'zod';

/**
 * Schémas de validation Zod pour les routes API
 */

// Schéma de pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Schéma de tri
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Schéma pour les filtres de recherche
export const searchSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  segment: z.string().optional(),
  donorType: z.string().optional(),
});

// Schéma combiné pour les requêtes de liste
export const listQuerySchema = paginationSchema.merge(sortSchema).merge(searchSchema);

// Schéma pour créer un donateur
export const createDonorSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").max(100),
  lastName: z.string().min(1, "Le nom est requis").max(100),
  email: z.string().email("Email invalide").optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  mobile: z.string().max(20).optional().nullable(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  address2: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(50).default("Canada"),
  profession: z.string().max(100).optional().nullable(),
  employer: z.string().max(100).optional().nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'LAPSED', 'DECEASED', 'DO_NOT_CONTACT', 'PENDING']).default('ACTIVE'),
  donorType: z.enum(['INDIVIDUAL', 'CORPORATE', 'FOUNDATION', 'GOVERNMENT', 'ANONYMOUS']).default('INDIVIDUAL'),
  segment: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(5000).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  consentEmail: z.boolean().default(false),
  consentPhone: z.boolean().default(false),
  consentMail: z.boolean().default(false),
  preferences: z.object({
    preferredChannel: z.enum(['EMAIL', 'PHONE', 'SMS', 'MAIL', 'SOCIAL_MEDIA']).optional(),
    preferredFrequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'NEVER']).optional(),
    preferredLanguage: z.string().default('fr'),
    causesOfInterest: z.array(z.string()).optional(),
  }).optional(),
});

// Schéma pour mettre à jour un donateur
export const updateDonorSchema = createDonorSchema.partial();

// Schéma pour les emails
export const emailSchema = z.object({
  to: z.string().email("Email destinataire invalide"),
  subject: z.string().min(1, "Le sujet est requis").max(200),
  html: z.string().optional(),
  text: z.string().optional(),
});

// Helper pour parser et valider les query params
export function parseQueryParams<T extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: T
): z.infer<T> {
  const params: Record<string, string | null> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return schema.parse(params);
}

// Helper pour parser et valider le body JSON
export function parseBody<T extends z.ZodTypeAny>(
  body: unknown,
  schema: T
): z.infer<T> {
  return schema.parse(body);
}
