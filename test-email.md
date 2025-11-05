# Email Configuration Troubleshooting

## Current Issue
Getting 500 error when sending OTP email.

## Steps to Fix:

### 1. Verify Resend API Key
Go to: https://resend.com/api-keys
- Check if the API key `re_MezagYQD_G5gx7XuU69MSi6YdRUd2AMcC` is still active
- If not, generate a new one

### 2. Update Supabase SMTP Settings
Go to: https://supabase.com/dashboard/project/irqphcvvvdrflsgselky/settings/auth

Scroll to "SMTP Settings" and verify:
```
✓ Enable Custom SMTP: ON
✓ Host: smtp.resend.com
✓ Port: 465 (or try 587)
✓ Username: resend
✓ Password: YOUR_RESEND_API_KEY
✓ Sender Email: onboarding@resend.dev
✓ Sender Name: Quiz Platform
```

### 3. Alternative: Use Supabase Default Email
Instead of custom SMTP:
1. Turn OFF "Enable Custom SMTP"
2. This uses Supabase's built-in email (limited but works for testing)
3. Check OTP codes in: Authentication → Logs

### 4. Check Resend Domain Verification
If using custom domain:
- Go to Resend dashboard
- Verify domain is properly configured
- For testing, use `onboarding@resend.dev` which is pre-verified

## Recommended for Testing
**Use Password Login** - doesn't require email setup!

1. Click "Use password instead"
2. Enter any email + password (min 6 chars)
3. Works immediately

## After Fixing
Test OTP again with a real email address you have access to.
