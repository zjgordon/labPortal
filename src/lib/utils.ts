import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes a URL input to an absolute URL
 * @param input - URL input (absolute http(s):// OR relative /path)
 * @param base - Base URL to use for relative paths (defaults to localhost:3000)
 * @returns Absolute URL string
 */
export function normalizeUrl(input: string, base?: string): string {
  // If input is already an absolute URL, return as-is
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input
  }
  
  // If input is a relative path, combine with base URL
  if (input.startsWith('/')) {
    const baseUrl = base || 'http://localhost:3000'
    // Ensure base URL doesn't end with slash
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    return `${cleanBase}${input}`
  }
  
  // If input is neither absolute nor relative, assume it's a relative path
  const baseUrl = base || 'http://localhost:3000'
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  return `${cleanBase}/${input}`
}
