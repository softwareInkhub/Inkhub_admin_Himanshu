# Authentication Flow Debugging Guide

## Overview of Authentication Flow

The admin.brmh.in application uses a centralized SSO (Single Sign-On) system with the following components:

### 1. **Auth Flow Components**
- **auth.brmh.in**: Centralized authentication service (handles login/logout)
- **admin.brmh.in**: Admin dashboard (protected application)
- **brmh.in**: Backend API (validates tokens, provides user data)

### 2. **Token Storage**
Tokens are stored in **cookies** with domain `.brmh.in` (accessible across all subdomains):
- `id_token` - JWT token containing user identity
- `access_token` - Token for API access
- `refresh_token` - Token for refreshing expired tokens

## Fixed Issue

### What Was Wrong?
The root page (`app/page.tsx`) was checking for an `auth` cookie with value `'1'`:
```typescript
const hasAuth = cookies().get('auth')?.value === '1'  // ❌ Wrong!
```

But your actual authentication uses `id_token`, `access_token`, and `refresh_token` cookies.

### What Was Fixed?
Updated to check for actual SSO tokens:
```typescript
const idToken = cookies().get('id_token')?.value
const accessToken = cookies().get('access_token')?.value
const hasAuth = !!(idToken || accessToken)  // ✅ Correct!
```

## How Authentication Works

### 1. **Middleware** (`middleware.ts`)
- Runs on every request before the page loads
- Checks for `id_token` or `access_token` cookies
- If not found → redirects to `https://auth.brmh.in/login?next={currentUrl}`
- If found → allows request to proceed

### 2. **Root Page** (`app/page.tsx`)
- Checks for `id_token` or `access_token` cookies
- If not found → redirects to auth.brmh.in
- If found → redirects to `/dashboard`

### 3. **RequireAuth Component** (`components/auth/RequireAuth.tsx`)
- Wraps protected pages in the admin layout
- Uses `SSOUtils.isAuthenticated()` to check cookies
- Syncs tokens from cookies to localStorage (for backward compatibility)
- Fetches user profile from backend
- If not authenticated → redirects to auth.brmh.in

## Debugging Steps

### Step 1: Check Cookies
Open browser DevTools → Application → Cookies → `https://admin.brmh.in`

**Expected cookies:**
```
id_token: eyJhbGciOiJSUzI1NiIs... (long JWT string)
access_token: eyJhbGciOiJSUzI1NiIs... (long JWT string)
refresh_token: ... (long string)
```

**Domain should be:** `.brmh.in` (note the leading dot - this makes it work across subdomains)

**If cookies are missing:**
1. Go to `https://auth.brmh.in/login`
2. Login with credentials
3. Check cookies again after successful login

### Step 2: Enable Detailed Logging

Add this to your browser console to see auth flow:
```javascript
// Monitor all cookie changes
Object.defineProperty(document, 'cookie', {
  get() {
    console.log('[Cookie Read]', document.cookie);
    return document.cookie;
  },
  set(value) {
    console.log('[Cookie Write]', value);
    document.cookie = value;
  }
});

// Monitor auth checks
window.__DEBUG_AUTH = true;
```

### Step 3: Check Middleware Execution

Add console logs to `middleware.ts`:
```typescript
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  console.log('[Middleware] Path:', pathname)
  console.log('[Middleware] Cookies:', req.cookies.getAll())
  
  const idToken = req.cookies.get('id_token')?.value
  const accessToken = req.cookies.get('access_token')?.value
  
  console.log('[Middleware] id_token:', idToken ? 'present' : 'missing')
  console.log('[Middleware] access_token:', accessToken ? 'present' : 'missing')
  
  // ... rest of middleware
}
```

### Step 4: Check Token Validity

Open browser console on admin.brmh.in:
```javascript
// Check if cookies exist
document.cookie.split(';').forEach(c => console.log(c.trim()))

// Check token expiration
const idToken = document.cookie.match(/id_token=([^;]+)/)?.[1]
if (idToken) {
  const payload = JSON.parse(atob(idToken.split('.')[1]))
  console.log('Token expires:', new Date(payload.exp * 1000))
  console.log('Is expired:', Date.now() > payload.exp * 1000)
}
```

### Step 5: Test Token Refresh

If tokens are expired, they should auto-refresh:
```javascript
// Manually trigger refresh (in browser console)
const refreshToken = document.cookie.match(/refresh_token=([^;]+)/)?.[1]
if (refreshToken) {
  fetch('https://brmh.in/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ refresh_token: refreshToken })
  })
  .then(r => r.json())
  .then(data => console.log('Refresh result:', data))
  .catch(err => console.error('Refresh error:', err))
}
```

## Common Issues & Solutions

### Issue 1: "Infinite redirect loop"
**Symptoms:** Page keeps redirecting between admin.brmh.in and auth.brmh.in

**Causes:**
- Cookies not being set with correct domain (`.brmh.in`)
- Cookie SameSite attribute blocking cross-site cookies
- HTTPS/HTTP mismatch

**Solution:**
1. Check cookie domain in DevTools
2. Ensure all domains use HTTPS (not HTTP)
3. Check backend sets cookies with:
   ```javascript
   Set-Cookie: access_token=...; Domain=.brmh.in; Secure; SameSite=Lax
   ```

### Issue 2: "Cookies present but still redirecting"
**Symptoms:** You see cookies in DevTools but still get redirected

**Causes:**
- Cookies set for wrong domain (e.g., `admin.brmh.in` instead of `.brmh.in`)
- Cookies expired
- Token format incorrect

**Solution:**
1. Clear all cookies for `*.brmh.in`
2. Login again from auth.brmh.in
3. Check new cookies have domain `.brmh.in`

### Issue 3: "401 Unauthorized errors"
**Symptoms:** API calls fail with 401 errors

**Causes:**
- Token expired and refresh failed
- Backend can't validate token

**Solution:**
1. Check token expiration (see Step 4)
2. Try manual refresh (see Step 5)
3. If refresh fails, clear cookies and login again

### Issue 4: "Tokens in cookies but localStorage empty"
**Symptoms:** Cookies exist but `localStorage.getItem('access_token')` returns null

**This is normal!** The `RequireAuth` component syncs cookies → localStorage automatically.

**If sync not working:**
1. Check RequireAuth is wrapping your pages
2. Check `SSOUtils.syncTokensFromCookies()` is called
3. Add debug log:
   ```typescript
   console.log('Synced tokens:', {
     cookie: document.cookie.match(/access_token=([^;]+)/)?.[1],
     localStorage: localStorage.getItem('access_token')
   })
   ```

## Testing Complete Flow

### 1. Clean Slate Test
```bash
# Clear all data
1. Open DevTools → Application → Storage → Clear site data
2. Close browser completely
3. Open new browser window
4. Go to https://admin.brmh.in
5. Should redirect to https://auth.brmh.in/login
6. Login with credentials
7. Should redirect back to https://admin.brmh.in/dashboard
8. Check cookies are present
```

### 2. Token Persistence Test
```bash
1. Login successfully
2. Close browser
3. Reopen browser
4. Go directly to https://admin.brmh.in/dashboard
5. Should NOT redirect (tokens persist)
```

### 3. Logout Test
```bash
1. While logged in, open console
2. Run: SSOUtils.logout()
3. Should redirect to auth.brmh.in
4. Check all cookies cleared
```

## Network Debugging

### Monitor Auth Requests
In DevTools → Network tab, filter for:
- `/auth/validate` - Token validation
- `/auth/refresh` - Token refresh
- `/auth/profile` - User profile fetch
- `/auth/logout` - Logout

**Expected flow:**
1. Initial page load → 302 redirect (if no tokens)
2. After login → cookies set via Set-Cookie headers
3. Page load → /auth/validate (200 OK)
4. Page load → /auth/profile (200 OK)

## Emergency Reset

If completely stuck, run this in browser console:
```javascript
// Clear everything
['id_token', 'access_token', 'refresh_token'].forEach(key => {
  document.cookie = `${key}=; domain=.brmh.in; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
  localStorage.removeItem(key)
})

// Force clean login
window.location.href = 'https://auth.brmh.in/login?next=' + encodeURIComponent('https://admin.brmh.in/dashboard')
```

## Contact Points

If issues persist, check:
1. Backend logs at brmh.in
2. Auth service logs at auth.brmh.in
3. Browser console for client-side errors
4. Network tab for failed requests

## Summary

**Expected behavior:**
✅ User with valid tokens → direct access to any admin.brmh.in route
✅ User without tokens → redirect to auth.brmh.in/login
✅ After login → redirect back to originally requested page
✅ Tokens persist across browser sessions
✅ Tokens auto-refresh before expiry

