import Joi from 'joi'

/**
 * Validation schemas for test management endpoints
 * These schemas ensure test data integrity and prevent malicious input
 */

// Create test validation schema
export const createTestSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(200)
    .trim()
    .required()
    .messages({
      'string.min': 'Test title must be at least 3 characters',
      'string.max': 'Test title must not exceed 200 characters',
      'string.empty': 'Test title is required',
      'any.required': 'Test title is required'
    }),

  description: Joi.string()
    .max(2000)
    .trim()
    .allow('', null)
    .messages({
      'string.max': 'Description must not exceed 2000 characters'
    }),

  category: Joi.string()
    .max(50)
    .trim()
    .allow('', null)
    .messages({
      'string.max': 'Category must not exceed 50 characters'
    }),

  status: Joi.string()
    .valid('draft', 'published', 'archived')
    .default('draft')
    .messages({
      'any.only': 'Status must be one of: draft, published, archived'
    }),

  visibility: Joi.string()
    .valid('public', 'private', 'unlisted')
    .default('private')
    .messages({
      'any.only': 'Visibility must be one of: public, private, unlisted'
    }),

  time_limit_minutes: Joi.number()
    .integer()
    .min(1)
    .max(600)  // Max 10 hours
    .allow(null)
    .messages({
      'number.min': 'Time limit must be at least 1 minute',
      'number.max': 'Time limit must not exceed 600 minutes (10 hours)',
      'number.integer': 'Time limit must be a whole number'
    }),

  max_attempts: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(1)
    .messages({
      'number.min': 'Max attempts must be at least 1',
      'number.max': 'Max attempts must not exceed 100',
      'number.integer': 'Max attempts must be a whole number'
    }),

  pass_score: Joi.number()
    .min(0)
    .max(100)
    .default(60)
    .messages({
      'number.min': 'Pass score must be at least 0',
      'number.max': 'Pass score must not exceed 100'
    }),

  show_correct_answers: Joi.boolean()
    .default(true),

  show_explanations: Joi.boolean()
    .default(true),

  shuffle_questions: Joi.boolean()
    .default(false),

  negative_marking: Joi.boolean()
    .default(false),

  start_at: Joi.date()
    .iso()
    .allow(null)
    .messages({
      'date.format': 'Start time must be a valid ISO 8601 date'
    }),

  end_at: Joi.date()
    .iso()
    .min(Joi.ref('start_at'))
    .allow(null)
    .messages({
      'date.format': 'End time must be a valid ISO 8601 date',
      'date.min': 'End time must be after start time'
    }),

  access_code: Joi.string()
    .max(50)
    .trim()
    .allow('', null)
    .messages({
      'string.max': 'Access code must not exceed 50 characters'
    }),

  per_question_time_seconds: Joi.number()
    .integer()
    .min(1)
    .allow(null)
    .messages({
      'number.min': 'Per-question time limit must be at least 1 second',
      'number.integer': 'Per-question time limit must be a whole number'
    })
})

// Update test validation schema (same as create but all fields optional)
export const updateTestSchema = Joi.object({
  title: Joi.string().min(3).max(200).trim(),
  description: Joi.string().max(2000).trim().allow('', null),
  category: Joi.string().max(50).trim().allow('', null),
  status: Joi.string().valid('draft', 'published', 'archived'),
  visibility: Joi.string().valid('public', 'private', 'unlisted'),
  time_limit_minutes: Joi.number().integer().min(1).max(600).allow(null),
  max_attempts: Joi.number().integer().min(1).max(100),
  pass_score: Joi.number().min(0).max(100),
  show_correct_answers: Joi.boolean(),
  show_explanations: Joi.boolean(),
  shuffle_questions: Joi.boolean(),
  negative_marking: Joi.boolean(),
  start_at: Joi.date().iso().allow(null),
  end_at: Joi.date().iso().min(Joi.ref('start_at')).allow(null),
  access_code: Joi.string().max(50).trim().allow('', null),
  per_question_time_seconds: Joi.number().integer().min(1).allow(null)
})

// UUID validation helper
export const uuidSchema = Joi.string()
  .uuid({ version: 'uuidv4' })
  .required()
  .messages({
    'string.guid': 'Invalid ID format',
    'any.required': 'ID is required'
  })
