# Quick Test: Auth Fix

## Test in 2 Minutes

### Step 1: Clear Everything
```
1. Open Chrome DevTools (F12)
2. Go to: Application → Storage → Clear site data
3. Click "Clear site data" button
4. Close DevTools
```

### Step 2: Test Fresh Login
```
1. Go to: https://admin.brmh.in
2. Should redirect to: https://auth.brmh.in/login?next=...
3. Enter your credentials and login
4. Should redirect back to: https://admin.brmh.in/dashboard
5. ✅ SUCCESS if you see dashboard
```

### Step 3: Verify Tokens
```
1. Open DevTools (F12)
2. Go to: Application → Cookies → admin.brmh.in
3. Verify you see these cookies:
   ✅ id_token (very long string)
   ✅ access_token (very long string)  
   ✅ refresh_token (long string)
4. Check Domain column shows: .brmh.in
```

### Step 4: Test Persistence
```
1. Close browser completely
2. Reopen browser
3. Go directly to: https://admin.brmh.in/dashboard
4. ✅ SUCCESS if dashboard loads immediately (no redirect to login)
```

## If Still Having Issues

### Debug Command (paste in browser console):
```javascript
// Quick diagnosis
const cookies = document.cookie.split(';').map(c => c.trim())
console.log('All cookies:', cookies)
console.log('Has auth tokens:', 
  cookies.some(c => c.startsWith('id_token=')) || 
  cookies.some(c => c.startsWith('access_token='))
)

// Check token expiry
const idToken = document.cookie.match(/id_token=([^;]+)/)?.[1]
if (idToken) {
  try {
    const payload = JSON.parse(atob(idToken.split('.')[1]))
    const expiryDate = new Date(payload.exp * 1000)
    console.log('Token expires:', expiryDate)
    console.log('Is expired:', Date.now() > payload.exp * 1000)
    console.log('Time until expiry:', Math.floor((payload.exp * 1000 - Date.now()) / 1000 / 60), 'minutes')
  } catch (e) {
    console.error('Invalid token format')
  }
} else {
  console.error('No id_token found in cookies!')
}
```

### Common Issues:

**Issue: Still redirects to auth.brmh.in even with cookies**
- Check cookie domain is `.brmh.in` (with leading dot)
- Try clearing cookies and login again
- Check if tokens are expired (use debug command above)

**Issue: Cookies disappear after closing browser**
- This is normal if "Remember Me" wasn't checked at login
- Login again and check "Remember Me" checkbox

**Issue: Getting 401 errors on API calls**
- Token might be expired
- Try logout and login again
- Check backend is running: https://brmh.in/health

## Expected Behavior

✅ **With valid tokens:** Instant access to any admin page
✅ **Without tokens:** Redirect to auth.brmh.in/login
✅ **After login:** Redirect back to originally requested page
✅ **On browser reopen:** Still logged in (tokens persist)

## Need More Help?

See `AUTH_DEBUGGING_GUIDE.md` for comprehensive debugging.

## The Fix Applied

The root page (`app/page.tsx`) was checking for wrong cookie:
```typescript
// Before: ❌
cookies().get('auth')?.value === '1'

// After: ✅
cookies().get('id_token')?.value || cookies().get('access_token')?.value
```

That's it! Simple but critical fix.

