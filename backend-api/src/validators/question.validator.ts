import Joi from 'joi'

/**
 * Validation schemas for question management endpoints
 * Ensures question data integrity and prevents malicious input
 */

// Question option schema
const optionSchema = Joi.object({
  id: Joi.string().uuid().optional(),
  label: Joi.string()
    .max(1000)
    .trim()
    .required()
    .messages({
      'string.max': 'Option label must not exceed 1000 characters',
      'string.empty': 'Option label is required'
    }),
  is_correct: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Option must specify if it is correct'
    }),
  order_index: Joi.number().integer().min(0).optional()
})

// Create question validation schema
export const createQuestionSchema = Joi.object({
  test_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid test ID format',
      'any.required': 'Test ID is required'
    }),

  section_id: Joi.string()
    .uuid()
    .allow(null)
    .messages({
      'string.guid': 'Invalid section ID format'
    }),

  type: Joi.string()
    .valid('mcq_single', 'mcq_multi', 'true_false', 'short_text', 'long_text', 'number')
    .required()
    .messages({
      'any.only': 'Question type must be one of: mcq_single, mcq_multi, true_false, short_text, long_text, number',
      'any.required': 'Question type is required'
    }),

  prompt: Joi.string()
    .min(3)
    .max(5000)
    .trim()
    .required()
    .messages({
      'string.min': 'Question prompt must be at least 3 characters',
      'string.max': 'Question prompt must not exceed 5000 characters',
      'string.empty': 'Question prompt is required',
      'any.required': 'Question prompt is required'
    }),

  points: Joi.number()
    .min(0)
    .max(1000)
    .default(1)
    .messages({
      'number.min': 'Points must be at least 0',
      'number.max': 'Points must not exceed 1000'
    }),

  order_index: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.min': 'Order index must be at least 0',
      'number.integer': 'Order index must be a whole number',
      'any.required': 'Order index is required'
    }),

  explanation: Joi.string()
    .max(2000)
    .trim()
    .allow('', null)
    .messages({
      'string.max': 'Explanation must not exceed 2000 characters'
    }),

  tolerance_numeric: Joi.number()
    .min(0)
    .allow(null)
    .messages({
      'number.min': 'Tolerance must be at least 0'
    }),

  // Options array (required for MCQ and True/False questions)
  options: Joi.array()
    .items(optionSchema)
    .when('type', {
      is: Joi.string().valid('mcq_single', 'mcq_multi', 'true_false'),
      then: Joi.array()
        .min(2)
        .max(20)
        .required()
        .custom((value, helpers) => {
          const correctCount = value.filter((opt: any) => opt.is_correct).length
          const questionType = helpers.state.ancestors[0].type

          if (questionType === 'mcq_single' && correctCount !== 1) {
            return helpers.error('array.correctCount.single')
          }
          if (questionType === 'true_false' && correctCount !== 1) {
            return helpers.error('array.correctCount.single')
          }
          if (questionType === 'mcq_multi' && correctCount < 1) {
            return helpers.error('array.correctCount.multi')
          }
          return value
        })
        .messages({
          'array.min': 'Questions must have at least 2 options',
          'array.max': 'Questions must not exceed 20 options',
          'array.correctCount.single': 'Single choice and True/False questions must have exactly 1 correct answer',
          'array.correctCount.multi': 'Multiple choice questions must have at least 1 correct answer'
        }),
      otherwise: Joi.array().optional()
    })
})

// Update question validation schema (same as create but most fields optional)
export const updateQuestionSchema = Joi.object({
  section_id: Joi.string().uuid().allow(null),
  type: Joi.string().valid('mcq_single', 'mcq_multi', 'true_false', 'short_text', 'long_text', 'number'),
  prompt: Joi.string().min(3).max(5000).trim(),
  points: Joi.number().min(0).max(1000),
  order_index: Joi.number().integer().min(0),
  explanation: Joi.string().max(2000).trim().allow('', null),
  tolerance_numeric: Joi.number().min(0).allow(null),
  options: Joi.array().items(optionSchema).min(2).max(20)
})

// UUID validation helper
export const uuidSchema = Joi.string()
  .uuid()
  .required()
  .messages({
    'string.guid': 'Invalid ID format',
    'any.required': 'ID is required'
  })
