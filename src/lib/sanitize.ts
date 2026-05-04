import DOMPurify from 'dompurify'

export function sanitizeText(input: string): string {
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: [] as string[],
    ALLOWED_ATTR: [] as string[],
  })
}

export function sanitizeRichText(input: string): string {
  return DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'br', 'p'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    FORCE_BODY: true,
  })
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}
