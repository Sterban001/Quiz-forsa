import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitization utilities for preventing XSS attacks
 * Uses DOMPurify to strip malicious HTML/JavaScript from user input
 */

/**
 * Sanitize plain text - strips ALL HTML tags
 * Use for: question prompts, answers, usernames, titles
 */
export function sanitizeText(dirty: string | null | undefined): string {
    if (!dirty) return ''

    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: [],      // No HTML tags allowed
        ALLOWED_ATTR: [],      // No attributes allowed
        KEEP_CONTENT: true     // Keep text content, remove tags
    })
}

/**
 * Sanitize HTML content - allows basic formatting
 * Use for: rich text descriptions (if ever needed)
 */
export function sanitizeHtml(dirty: string | null | undefined): string {
    if (!dirty) return ''

    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'code'],
        ALLOWED_ATTR: [],      // No attributes allowed (prevents onclick, etc.)
        KEEP_CONTENT: true
    })
}

/**
 * Sanitize an object recursively - cleans all string values
 * Use for: sanitizing entire request bodies
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
    if (!obj || typeof obj !== 'object') return obj

    const sanitized: any = Array.isArray(obj) ? [] : {}

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeText(value)
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item =>
                typeof item === 'object' ? sanitizeObject(item) :
                    typeof item === 'string' ? sanitizeText(item) : item
            )
        } else if (value && typeof value === 'object') {
            sanitized[key] = sanitizeObject(value)
        } else {
            sanitized[key] = value
        }
    }

    return sanitized as T
}

/**
 * Validate and sanitize URLs - prevents javascript: protocol attacks
 */
export function sanitizeUrl(url: string | null | undefined): string {
    if (!url) return ''

    try {
        const parsed = new URL(url)
        // Only allow safe protocols
        if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
            return url
        }
        return ''
    } catch {
        // If URL parsing fails, it's not a valid URL
        return ''
    }
}
