import Joi from 'joi'

/**
 * Validation schemas for test attempt endpoints
 * Ensures attempt data integrity and prevents cheating/malicious input
 */

// Start attempt validation schema
export const startAttemptSchema = Joi.object({
  test_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid test ID format',
      'any.required': 'Test ID is required'
    })
})

// Save answer validation schema
export const saveAnswerSchema = Joi.object({
  question_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid question ID format',
      'any.required': 'Question ID is required'
    }),

  response_json: Joi.object()
    .required()
    .messages({
      'object.base': 'Response must be a valid JSON object',
      'any.required': 'Response is required'
    }),

  time_spent: Joi.number()
    .integer()
    .min(0)
    .max(36000)  // Max 10 hours on a single question
    .allow(null)
    .messages({
      'number.min': 'Time spent cannot be negative',
      'number.max': 'Time spent exceeds maximum allowed (36000 seconds)',
      'number.integer': 'Time spent must be a whole number'
    })
})

// Update attempt validation schema (for admin grading)
export const updateAttemptSchema = Joi.object({
  score: Joi.number()
    .min(0)
    .max(100000)  // Reasonable max score
    .messages({
      'number.min': 'Score cannot be negative',
      'number.max': 'Score exceeds maximum allowed'
    }),

  max_score: Joi.number()
    .min(0)
    .max(100000)
    .messages({
      'number.min': 'Max score cannot be negative',
      'number.max': 'Max score exceeds maximum allowed'
    }),

  percentage: Joi.number()
    .min(0)
    .max(100)
    .messages({
      'number.min': 'Percentage must be at least 0',
      'number.max': 'Percentage must not exceed 100'
    }),

  passed: Joi.boolean(),

  status: Joi.string()
    .valid('in_progress', 'submitted', 'graded')
    .messages({
      'any.only': 'Status must be one of: in_progress, submitted, graded'
    }),

  feedback: Joi.string()
    .max(5000)
    .trim()
    .allow('', null)
    .messages({
      'string.max': 'Feedback must not exceed 5000 characters'
    })
})

// Update answer validation schema (for manual grading)
export const updateAnswerSchema = Joi.object({
  points_earned: Joi.number()
    .min(0)
    .max(1000)
    .required()
    .messages({
      'number.min': 'Points earned cannot be negative',
      'number.max': 'Points earned exceeds maximum allowed',
      'any.required': 'Points earned is required'
    }),

  feedback: Joi.string()
    .max(2000)
    .trim()
    .allow('', null)
    .messages({
      'string.max': 'Feedback must not exceed 2000 characters'
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
