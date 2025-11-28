#!/usr/bin/env node

/**
 * Security Testing Script
 * Tests all security measures implemented in the API
 *
 * Usage: node test-security.js
 *
 * Requirements:
 * - Backend API running on http://localhost:4000
 * - Valid test user credentials in .env.test
 */

const API_URL = process.env.API_URL || 'http://localhost:4000/api'

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

let testsPassed = 0
let testsFailed = 0

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logTest(name, passed, details = '') {
  if (passed) {
    log(`✓ ${name}`, 'green')
    testsPassed++
  } else {
    log(`✗ ${name}`, 'red')
    if (details) log(`  ${details}`, 'yellow')
    testsFailed++
  }
}

function logSection(name) {
  console.log()
  log(`${'='.repeat(60)}`, 'cyan')
  log(`  ${name}`, 'bright')
  log(`${'='.repeat(60)}`, 'cyan')
  console.log()
}

// Helper function to make HTTP requests
async function request(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json().catch(() => null)

    return {
      status: response.status,
      headers: response.headers,
      data,
      ok: response.ok
    }
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      data: null,
      ok: false
    }
  }
}

// Test Suite 1: Cookie Security
async function testCookieSecurity() {
  logSection('Cookie Security Tests')

  // Test 1: Login should set secure cookies
  const loginResponse = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'Test123456'
    })
  })

  const setCookieHeader = loginResponse.headers.get('set-cookie')

  if (setCookieHeader) {
    const hasHttpOnly = setCookieHeader.includes('HttpOnly')
    const hasSameSite = setCookieHeader.includes('SameSite=Strict') || setCookieHeader.includes('SameSite=strict')

    logTest(
      'Login sets HttpOnly cookie',
      hasHttpOnly,
      hasHttpOnly ? '' : 'Cookie missing HttpOnly flag'
    )

    logTest(
      'Login sets SameSite=Strict cookie',
      hasSameSite,
      hasSameSite ? '' : 'Cookie missing SameSite flag'
    )
  } else {
    logTest('Login sets cookies', false, 'No Set-Cookie header found')
  }
}

// Test Suite 2: CORS Protection
async function testCORS() {
  logSection('CORS Protection Tests')

  // Test 1: Request from unauthorized origin should be blocked
  const unauthorizedOrigin = await request('/auth/me', {
    headers: {
      'Origin': 'https://evil.com'
    }
  })

  logTest(
    'Blocks unauthorized origin',
    !unauthorizedOrigin.ok && (unauthorizedOrigin.status === 401 || unauthorizedOrigin.status === 403),
    `Status: ${unauthorizedOrigin.status}`
  )

  // Test 2: Request from allowed origin should work
  const authorizedOrigin = await request('/health', {
    headers: {
      'Origin': 'http://localhost:3000'
    }
  })

  logTest(
    'Allows authorized origin',
    authorizedOrigin.ok,
    `Status: ${authorizedOrigin.status}`
  )
}

// Test Suite 3: Input Validation
async function testInputValidation() {
  logSection('Input Validation Tests')

  // Test 1: Login with invalid email
  const invalidEmail = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'not-an-email',
      password: 'Test123456'
    })
  })

  logTest(
    'Rejects invalid email format',
    !invalidEmail.ok && invalidEmail.status === 400,
    `Status: ${invalidEmail.status}`
  )

  // Test 2: Login with short password
  const shortPassword = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: '123'
    })
  })

  logTest(
    'Rejects short password',
    !shortPassword.ok && shortPassword.status === 400,
    `Status: ${shortPassword.status}`
  )

  // Test 3: Login with missing fields
  const missingFields = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({})
  })

  logTest(
    'Rejects missing required fields',
    !missingFields.ok && missingFields.status === 400,
    `Status: ${missingFields.status}`
  )

  // Test 4: OTP with invalid email
  const invalidOtpEmail = await request('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({
      email: '<script>alert("xss")</script>@example.com'
    })
  })

  logTest(
    'Rejects malicious email input',
    !invalidOtpEmail.ok && invalidOtpEmail.status === 400,
    `Status: ${invalidOtpEmail.status}`
  )

  // Test 5: Extremely long input (buffer overflow test)
  const longInput = await request('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({
      email: 'a'.repeat(10000) + '@example.com'
    })
  })

  logTest(
    'Rejects extremely long input',
    !longInput.ok && longInput.status === 400,
    `Status: ${longInput.status}`
  )
}

// Test Suite 4: Rate Limiting
async function testRateLimiting() {
  logSection('Rate Limiting Tests')

  log('Testing login rate limit (5 requests/15min)...', 'yellow')

  const loginAttempts = []
  for (let i = 0; i < 7; i++) {
    const attempt = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: `ratelimit${i}@example.com`,
        password: 'WrongPassword123'
      })
    })
    loginAttempts.push(attempt)

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  const blockedAttempts = loginAttempts.filter(a => a.status === 429)

  logTest(
    'Login rate limiting works',
    blockedAttempts.length > 0,
    blockedAttempts.length > 0
      ? `Blocked ${blockedAttempts.length} requests`
      : 'No requests were rate limited (may need more attempts)'
  )

  // Test OTP rate limiting
  log('Testing OTP rate limit (3 requests/15min)...', 'yellow')

  const otpAttempts = []
  for (let i = 0; i < 5; i++) {
    const attempt = await request('/auth/otp/send', {
      method: 'POST',
      body: JSON.stringify({
        email: `ratelimit${i}@example.com`
      })
    })
    otpAttempts.push(attempt)
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  const blockedOtp = otpAttempts.filter(a => a.status === 429)

  logTest(
    'OTP rate limiting works',
    blockedOtp.length > 0,
    blockedOtp.length > 0
      ? `Blocked ${blockedOtp.length} requests`
      : 'No requests were rate limited (may need more attempts)'
  )
}

// Test Suite 5: Security Headers
async function testSecurityHeaders() {
  logSection('Security Headers Tests')

  const response = await request('/health')
  const headers = response.headers

  // Test CSP header
  const csp = headers.get('content-security-policy')
  logTest(
    'Content-Security-Policy header present',
    csp !== null,
    csp ? `CSP: ${csp.substring(0, 100)}...` : 'Missing CSP header'
  )

  // Test X-Frame-Options
  const frameOptions = headers.get('x-frame-options')
  logTest(
    'X-Frame-Options header present',
    frameOptions !== null,
    frameOptions || 'Missing X-Frame-Options header'
  )

  // Test X-Content-Type-Options
  const contentTypeOptions = headers.get('x-content-type-options')
  logTest(
    'X-Content-Type-Options: nosniff',
    contentTypeOptions === 'nosniff',
    contentTypeOptions || 'Missing X-Content-Type-Options header'
  )

  // Test Strict-Transport-Security (in production)
  const hsts = headers.get('strict-transport-security')
  if (process.env.NODE_ENV === 'production') {
    logTest(
      'HSTS header present (production)',
      hsts !== null,
      hsts || 'Missing HSTS header in production'
    )
  } else {
    log('  ℹ HSTS test skipped (not in production)', 'blue')
  }
}

// Test Suite 6: Authentication & Authorization
async function testAuthAndAuthorization() {
  logSection('Authentication & Authorization Tests')

  // Test 1: Access protected route without token
  const noToken = await request('/auth/me')

  logTest(
    'Blocks access without authentication token',
    !noToken.ok && noToken.status === 401,
    `Status: ${noToken.status}`
  )

  // Test 2: Access with invalid token
  const invalidToken = await request('/auth/me', {
    headers: {
      'Authorization': 'Bearer invalid_token_12345'
    }
  })

  logTest(
    'Rejects invalid authentication token',
    !invalidToken.ok && invalidToken.status === 401,
    `Status: ${invalidToken.status}`
  )

  // Test 3: Access admin route as non-admin
  const loginResponse = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'student@example.com',
      password: 'Student123456'
    })
  })

  if (loginResponse.ok && loginResponse.data?.data?.session?.access_token) {
    const token = loginResponse.data.data.session.access_token

    const adminRoute = await request('/tests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test',
        status: 'published'
      })
    })

    logTest(
      'Blocks non-admin from admin routes',
      !adminRoute.ok && adminRoute.status === 403,
      `Status: ${adminRoute.status}`
    )
  } else {
    logTest('Login for authorization test', false, 'Could not authenticate test user')
  }
}

// Test Suite 7: UUID Validation
async function testUUIDValidation() {
  logSection('UUID Validation Tests')

  // Get a valid token first
  const loginResponse = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'Test123456'
    })
  })

  if (!loginResponse.ok) {
    log('  ℹ UUID tests skipped (authentication failed)', 'blue')
    return
  }

  const token = loginResponse.data?.data?.session?.access_token

  // Test 1: Invalid UUID format
  const invalidUuid = await request('/tests/not-a-uuid', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  logTest(
    'Rejects invalid UUID format',
    !invalidUuid.ok && invalidUuid.status === 400,
    `Status: ${invalidUuid.status}`
  )

  // Test 2: SQL injection attempt via UUID
  const sqlInjection = await request('/tests/1\' OR \'1\'=\'1', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  logTest(
    'Blocks SQL injection in UUID parameter',
    !sqlInjection.ok && sqlInjection.status === 400,
    `Status: ${sqlInjection.status}`
  )
}

// Test Suite 8: XSS Prevention
async function testXSSPrevention() {
  logSection('XSS Prevention Tests')

  // Test 1: Script tag in email
  const scriptInEmail = await request('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({
      email: '<script>alert("xss")</script>'
    })
  })

  logTest(
    'Rejects script tags in input',
    !scriptInEmail.ok && scriptInEmail.status === 400,
    `Status: ${scriptInEmail.status}`
  )

  // Test 2: Event handler in input
  const eventHandler = await request('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com" onerror="alert(1)'
    })
  })

  logTest(
    'Rejects event handlers in input',
    !eventHandler.ok && eventHandler.status === 400,
    `Status: ${eventHandler.status}`
  )
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), 'bright')
  log('  SECURITY TEST SUITE', 'bright')
  log('  Backend API Security Testing', 'bright')
  log('='.repeat(60) + '\n', 'bright')

  log(`Testing API at: ${API_URL}`, 'cyan')
  log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'cyan')
  console.log()

  try {
    // Check if API is running
    const healthCheck = await request('/health')
    if (!healthCheck.ok) {
      log('❌ Backend API is not running!', 'red')
      log(`   Please start the API server on ${API_URL}`, 'yellow')
      process.exit(1)
    }
    log('✓ Backend API is running\n', 'green')

    // Run all test suites
    await testCookieSecurity()
    await testCORS()
    await testInputValidation()
    await testRateLimiting()
    await testSecurityHeaders()
    await testAuthAndAuthorization()
    await testUUIDValidation()
    await testXSSPrevention()

    // Summary
    logSection('Test Summary')
    const total = testsPassed + testsFailed
    const percentage = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : 0

    log(`Total Tests: ${total}`, 'cyan')
    log(`Passed: ${testsPassed}`, 'green')
    log(`Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green')
    log(`Success Rate: ${percentage}%`, percentage >= 80 ? 'green' : 'yellow')

    console.log()
    if (testsFailed === 0) {
      log('🎉 All security tests passed!', 'green')
      process.exit(0)
    } else {
      log('⚠️  Some security tests failed. Please review the results above.', 'yellow')
      process.exit(1)
    }

  } catch (error) {
    log(`\n❌ Test suite failed with error: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  }
}

// Run tests
runAllTests()
