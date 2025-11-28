import Joi from 'joi'

/**
 * Validation schemas for authentication endpoints
 * These schemas validate user input to prevent malicious data and ensure data integrity
 */

// Email validation - RFC 5322 compliant
const emailSchema = Joi.string()
  .email()
  .lowercase()
  .trim()
  .max(255)
  .required()
  .messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email is required',
    'any.required': 'Email is required'
  })

// Password validation - minimum security requirements
const passwordSchema = Joi.string()
  .min(8)
  .max(128)
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  })

// OTP token validation - 6 digit code
const otpTokenSchema = Joi.string()
  .length(6)
  .pattern(/^[0-9]+$/)
  .required()
  .messages({
    'string.length': 'OTP must be 6 digits',
    'string.pattern.base': 'OTP must contain only numbers',
    'string.empty': 'OTP code is required',
    'any.required': 'OTP code is required'
  })

// Login validation schema
export const loginSchema = Joi.object({
  email: emailSchema,
  password: passwordSchema
})

// Send OTP validation schema
export const sendOtpSchema = Joi.object({
  email: emailSchema
})

// Verify OTP validation schema
export const verifyOtpSchema = Joi.object({
  email: emailSchema,
  token: otpTokenSchema
})
