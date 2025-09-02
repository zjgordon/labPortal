import { z } from 'zod'

/**
 * Enhanced URL validation that allows:
 * - HTTP/HTTPS absolute URLs
 * - Leading-slash relative paths (for reverse proxy)
 * - Local network URLs (localhost, .local domains)
 */
export const urlSchema = z.string()
  .min(1, "URL is required")
  .max(500, "URL too long")
  .refine((url) => {
    // Allow relative paths starting with /
    if (url.startsWith('/')) {
      return true
    }
    
    try {
      const parsed = new URL(url)
      // Allow http, https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false
      }
      
      // Allow localhost and .local domains
      const hostname = parsed.hostname.toLowerCase()
      if (hostname === 'localhost' || 
          hostname.endsWith('.local') ||
          hostname.match(/^10\.|^172\.(1[6-9]|2[0-9]|3[01])\.|^192\.168\./)) {
        return true
      }
      
      // Allow other domains (can be restricted further if needed)
      return true
    } catch {
      return false
    }
  }, "Invalid URL format. Must be a valid HTTP/HTTPS URL or relative path starting with /")

/**
 * Enhanced title validation
 */
export const titleSchema = z.string()
  .min(1, "Title is required")
  .max(100, "Title must be 100 characters or less")
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, "Title cannot be empty after trimming")

/**
 * Enhanced description validation
 */
export const descriptionSchema = z.string()
  .min(1, "Description is required")
  .max(500, "Description must be 500 characters or less")
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, "Description cannot be empty after trimming")

/**
 * Enhanced health path validation that allows:
 * - Leading-slash relative paths (e.g., /health, /status)
 * - Empty/null values (optional field)
 */
export const healthPathSchema = z.string()
  .max(100, "Health path too long")
  .optional()
  .refine((path) => {
    if (!path) return true // Optional field
    // Must start with / and be a valid path
    return path.startsWith('/') && path.length > 1
  }, "Health path must start with / and be a valid path")

/**
 * Group validation schema
 */
export const groupSchema = z.string()
  .min(1, "Group is required")
  .max(50, "Group name too long")
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, "Group cannot be empty after trimming")

/**
 * Card creation schema
 */
export const createCardSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  url: urlSchema,
  healthPath: healthPathSchema,
  group: groupSchema.default("General"),
  isEnabled: z.boolean().default(true),
})

/**
 * Card update schema
 */
export const updateCardSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema.optional(),
  url: urlSchema.optional(),
  healthPath: healthPathSchema,
  iconPath: z.string().optional(),
  order: z.number().int().min(0, "Order must be non-negative").optional(),
  group: groupSchema.optional(),
  isEnabled: z.boolean().optional(),
})

/**
 * Card reorder schema
 */
export const reorderSchema = z.object({
  cards: z.array(z.object({
    id: z.string().min(1, "Card ID is required"),
    order: z.number().int().min(0, "Order must be non-negative"),
    group: z.string().min(1, "Group is required"),
  })).min(1, "At least one card must be provided"),
})

/**
 * Status query schema
 */
export const statusQuerySchema = z.object({
  cardId: z.string().min(1, "Card ID is required"),
})

/**
 * Sanitize and validate input strings
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
}

/**
 * Validate and sanitize URL
 */
export function validateAndSanitizeUrl(url: string): string | null {
  try {
    const result = urlSchema.parse(url)
    return result
  } catch {
    return null
  }
}

/**
 * Host name validation - safe for system use
 */
export const hostNameSchema = z.string()
  .min(1, "Host name is required")
  .max(100, "Host name must be 100 characters or less")
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, "Host name cannot be empty after trimming")
  .refine((val) => /^[a-zA-Z0-9._-]+$/.test(val), "Host name can only contain letters, numbers, dots, underscores, and hyphens")

/**
 * Address validation for host
 */
export const addressSchema = z.string()
  .max(500, "Address too long")
  .optional()
  .transform((val) => val?.trim() || null)
  .refine((val) => !val || val.length > 0, "Address cannot be empty after trimming")

/**
 * Unit name validation - must be safe for systemd
 */
export const unitNameSchema = z.string()
  .min(1, "Unit name is required")
  .max(100, "Unit name must be 100 characters or less")
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, "Unit name cannot be empty after trimming")
  .refine((val) => /^[a-zA-Z0-9._@-]+$/.test(val), "Unit name can only contain letters, numbers, dots, underscores, at signs, and hyphens")
  .refine((val) => val.endsWith('.service'), "Unit name must end with .service")

/**
 * Display name validation
 */
export const displayNameSchema = z.string()
  .min(1, "Display name is required")
  .max(100, "Display name must be 100 characters or less")
  .transform((val) => val.trim())
  .refine((val) => val.length > 0, "Display name cannot be empty after trimming")

/**
 * Action kind validation
 */
export const actionKindSchema = z.enum(['start', 'stop', 'restart', 'status'], {
  errorMap: () => ({ message: "Action kind must be one of: start, stop, restart, status" })
})

/**
 * Action status validation
 */
export const actionStatusSchema = z.enum(['queued', 'running', 'completed', 'failed'], {
  errorMap: () => ({ message: "Action status must be one of: queued, running, completed, failed" })
})

/**
 * Host creation schema
 */
export const createHostSchema = z.object({
  name: hostNameSchema,
  address: addressSchema,
  agentToken: z.string().optional(),
})

/**
 * Host update schema
 */
export const updateHostSchema = z.object({
  name: hostNameSchema.optional(),
  address: addressSchema,
  agentToken: z.string().optional(),
})

/**
 * ManagedService creation schema
 */
export const createServiceSchema = z.object({
  cardId: z.string().optional(),
  hostId: z.string().min(1, "Host ID is required"),
  unitName: unitNameSchema,
  displayName: displayNameSchema,
  description: z.string().max(500, "Description too long").optional().transform((val) => val?.trim() || null),
  allowStart: z.boolean().default(true),
  allowStop: z.boolean().default(true),
  allowRestart: z.boolean().default(true),
})

/**
 * ManagedService update schema
 */
export const updateServiceSchema = z.object({
  cardId: z.string().optional(),
  hostId: z.string().min(1, "Host ID is required").optional(),
  unitName: unitNameSchema.optional(),
  displayName: displayNameSchema.optional(),
  description: z.string().max(500, "Description too long").optional().transform((val) => val?.trim() || null),
  allowStart: z.boolean().optional(),
  allowStop: z.boolean().optional(),
  allowRestart: z.boolean().optional(),
})

/**
 * Action creation schema
 */
export const createActionSchema = z.object({
  hostId: z.string().min(1, "Host ID is required"),
  serviceId: z.string().min(1, "Service ID is required"),
  kind: actionKindSchema,
  status: actionStatusSchema.default("queued"),
  requestedBy: z.string().optional(),
})
