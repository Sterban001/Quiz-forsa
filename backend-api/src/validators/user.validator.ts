import Joi from 'joi'

/**
 * Validation schemas for user management endpoints
 * Ensures user data integrity and prevents malicious input
 */

// Update user/profile validation schema
export const updateUserSchema = Joi.object({
  display_name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .pattern(/^[a-zA-Z0-9\s\-_.]+$/)
    .messages({
      'string.min': 'Display name must be at least 2 characters',
      'string.max': 'Display name must not exceed 100 characters',
      'string.pattern.base': 'Display name can only contain letters, numbers, spaces, hyphens, underscores, and periods'
    }),

  avatar_url: Joi.string()
    .uri()
    .max(500)
    .allow('', null)
    .messages({
      'string.uri': 'Avatar URL must be a valid URL',
      'string.max': 'Avatar URL must not exceed 500 characters'
    }),

  phone: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Phone number must be in E.164 format (e.g., +1234567890)'
    }),

  bio: Joi.string()
    .max(500)
    .trim()
    .allow('', null)
    .messages({
      'string.max': 'Bio must not exceed 500 characters'
    }),

  metadata: Joi.object()
    .allow(null)
    .messages({
      'object.base': 'Metadata must be a valid JSON object'
    })
})

// Admin update user schema (includes role)
export const adminUpdateUserSchema = updateUserSchema.keys({
  role: Joi.string()
    .valid('admin', 'user')
    .messages({
      'any.only': 'Role must be either admin or user'
    })
})

// UUID validation helper
export const uuidSchema = Joi.string()
  .uuid()
  .required()
  .messages({
    'string.guid': 'Invalid ID format',
    'any.required': 'ID is required'
  })
