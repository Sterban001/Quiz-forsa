/**
 * Pagination utility for API responses
 */

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Parse and validate pagination parameters from query string
 */
export function parsePaginationParams(query: any): Required<PaginationParams> {
  const page = Math.max(1, parseInt(query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10)) // Max 100, default 10

  return { page, limit }
}

/**
 * Calculate offset for database query
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}

/**
 * Create a paginated response
 */
export function paginateResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    meta: buildPaginationMeta(page, limit, total),
  }
}

/**
 * Apply range-based pagination for Supabase queries
 * Supabase uses range(from, to) instead of limit/offset
 */
export function getSupabaseRange(page: number, limit: number): [number, number] {
  const offset = calculateOffset(page, limit)
  const from = offset
  const to = offset + limit - 1

  return [from, to]
}
