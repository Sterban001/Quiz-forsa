import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

/**
 * Validation middleware factory
 * Creates middleware that validates request body against a Joi schema
 *
 * @param schema - Joi validation schema
 * @param target - Which part of the request to validate (body, params, query)
 * @returns Express middleware function
 */
export const validate = (
  schema: Joi.ObjectSchema,
  target: 'body' | 'params' | 'query' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,  // Return all errors, not just the first one
      stripUnknown: true,  // Remove unknown fields
      convert: true  // Type coercion (e.g., string "1" to number 1)
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))

      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors
        }
      })
    }

    // Replace the original data with the validated and sanitized data
    req[target] = value
    return next()
  }
}

/**
 * Validates UUID parameters in the route
 * Usage: app.get('/test/:id', validateUuid('id'), handler)
 */
export const validateUuid = (...paramNames: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    for (const paramName of paramNames) {
      const value = req.params[paramName]

      if (!value) {
        return res.status(400).json({
          success: false,
          error: { message: `Parameter '${paramName}' is required` }
        })
      }

      if (!uuidRegex.test(value)) {
        return res.status(400).json({
          success: false,
          error: { message: `Parameter '${paramName}' must be a valid UUID` }
        })
      }
    }

    return next()
  }
}
