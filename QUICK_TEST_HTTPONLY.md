# Quick Test: HttpOnly Cookies Fix

## What Was Wrong

Your cookies had `httpOnly=true` which means:
- ❌ JavaScript **CANNOT** read them via `document.cookie`
- ✅ They're automatically sent with requests (secure!)

This caused your client-side auth checks to fail, creating an infinite redirect loop.

## What We Fixed

We added a **readable flag cookie** that client-side can check:

```
httpOnly Cookies (invisible to JS):
- id_token ✅
- access_token ✅  
- refresh_token ✅

NEW Non-httpOnly Flag (visible to JS):
- auth_valid=1 ✅ ← Client can read this!
```

## Test Now (2 Minutes)

### Step 1: Restart Your Dev Server
```bash
# Stop server (Ctrl+C)
npm run dev
# Or
yarn dev
```

### Step 2: Clear Browser Data
```
1. Open DevTools (F12)
2. Application → Storage → "Clear site data"
3. Close DevTools
4. Close ALL browser tabs for *.brmh.in
```

### Step 3: Test Login Flow
```
1. Go to: https://admin.brmh.in
2. Should redirect to: https://auth.brmh.in/login?next=...
3. Login with your credentials
4. Should redirect back to: admin.brmh.in/dashboard
5. ✅ Dashboard loads (NO INFINITE REDIRECT!)
```

### Step 4: Verify Cookies
```
DevTools → Application → Cookies → admin.brmh.in

Should see:
✅ id_token (httpOnly: Yes)
✅ access_token (httpOnly: Yes)
✅ refresh_token (httpOnly: Yes)
✅ auth_valid (httpOnly: No) ← NEW!
```

### Step 5: Verify in Console
```javascript
// Paste in browser console:
console.log('Auth valid:', document.cookie.includes('auth_valid=1'))
// Should show: Auth valid: true

console.log('Has id_token:', document.cookie.includes('id_token'))
// Should show: Has id_token: false (expected - it's httpOnly!)
```

## Quick Debug

If still having issues, paste this in console:

```javascript
// Check what cookies are visible to JavaScript
const visibleCookies = document.cookie.split(';').map(c => c.trim())
console.log('Visible cookies:', visibleCookies)

// Check if auth flag is set
const hasAuthFlag = visibleCookies.some(c => c.startsWith('auth_valid='))
console.log('Has auth_valid flag:', hasAuthFlag)

// If no auth flag, check httpOnly cookies in DevTools:
// Application → Cookies → Should see id_token, access_token there
```

## Expected Behavior

✅ **First visit:** Redirect to auth.brmh.in
✅ **After login:** Redirect back, dashboard loads
✅ **Refresh page:** Dashboard loads immediately
✅ **Close/reopen browser:** Still logged in
✅ **No infinite redirects:** Stays on dashboard

## Files Changed

1. **`middleware.ts`** - Sets `auth_valid` flag when tokens present
2. **`components/auth/RequireAuth.tsx`** - No longer checks client-side auth
3. **`lib/sso-utils.ts`** - Checks `auth_valid` flag

## Why This Works

```
Before:
1. Login → httpOnly cookies set
2. Client checks cookies → Can't read them! ❌
3. Thinks not logged in → Redirects
4. Loop forever ♾️

After:
1. Login → httpOnly cookies set
2. Middleware sees cookies → Sets auth_valid flag
3. Client checks auth_valid flag → Can read it! ✅
4. Knows logged in → Shows dashboard ✅
```

## Still Having Issues?

### Clear everything and try clean:
```bash
# In DevTools Console:
['id_token', 'access_token', 'refresh_token', 'auth_valid'].forEach(k => {
  document.cookie = `${k}=; domain=.brmh.in; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
})
localStorage.clear()
window.location.href = 'https://admin.brmh.in'
```

### Check middleware is running:
```bash
# Should see this in terminal when visiting admin.brmh.in:
[Inkhub Middleware] User authenticated via SSO cookies, allowing access
```

### Verify backend is reachable:
```bash
curl https://brmh.in/health
# Should return success
```

## Need More Help?

See detailed guide: `HTTPONLY_COOKIES_FIX.md`

## Summary

**Problem:** HttpOnly cookies invisible to JavaScript
**Solution:** Middleware sets readable `auth_valid` flag
**Result:** Auth works while maintaining security ✅

