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
 * Card creation schema
 */
export const createCardSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  url: urlSchema,
  isEnabled: z.boolean().default(true),
})

/**
 * Card update schema
 */
export const updateCardSchema = z.object({
  title: titleSchema.optional(),
  description: descriptionSchema.optional(),
  url: urlSchema.optional(),
  iconPath: z.string().optional(),
  order: z.number().int().min(0, "Order must be non-negative").optional(),
  isEnabled: z.boolean().optional(),
})

/**
 * Card reorder schema
 */
export const reorderSchema = z.object({
  cards: z.array(z.object({
    id: z.string().min(1, "Card ID is required"),
    order: z.number().int().min(0, "Order must be non-negative"),
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
