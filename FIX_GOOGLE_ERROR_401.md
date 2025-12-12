# Google Sign-In Troubleshooting - Error 401: invalid_client

## What This Error Means
Google doesn't recognize your Client ID. This happens when:
1. ❌ Client ID is still a placeholder
2. ❌ Client ID is formatted incorrectly
3. ❌ Client ID is for wrong OAuth app type
4. ❌ Redirect URI not added to Google Cloud Console

---

## Quick Fix - Get Your Real Client ID

### Option A: Use Google Cloud Console (Recommended)

**Visit:** https://console.cloud.google.com/

**Follow these exact steps:**

1. **Select or Create Project**
   - Click project dropdown (top left)
   - Click "NEW PROJECT"
   - Name: `ISL-Learning-App`
   - Click CREATE
   - Wait 1-2 minutes for setup

2. **Enable Google+ API**
   - Left sidebar → APIs & Services → Library
   - Search: `Google+ API`
   - Click on result → ENABLE

3. **Create OAuth Credentials**
   - Left sidebar → APIs & Services → Credentials
   - Click "+ CREATE CREDENTIALS"
   - Choose "OAuth 2.0 Client ID"
   - If asked about consent screen: Click "CREATE OAUTH CONSENT SCREEN"
     - Select "External"
     - Fill app name: `ISL Learning App`
     - Fill support email: your email
     - Click "SAVE AND CONTINUE" multiple times
   - Back to Credentials → "+ CREATE CREDENTIALS" → "OAuth 2.0 Client ID"

4. **Add Redirect URIs**
   - Application type: **Web application**
   - Name: `ISL Web Client`
   - Under "Authorized redirect URIs" add:
     ```
     http://localhost:5173
     http://localhost:5174
     http://localhost:5175
     http://localhost:3000
     ```
   - Click CREATE

5. **Copy Your Client ID**
   - Dialog shows your credentials
   - **Client ID** looks like:
     ```
     1234567890-abcdefghijklmnop.apps.googleusercontent.com
     ```
   - Copy this entire string

### Option B: If You Already Have a Project

1. Go to: https://console.cloud.google.com/apis/credentials
2. Look for "Web application" type credentials
3. Click the edit icon (pencil)
4. Add these redirect URIs if not present:
   ```
   http://localhost:5174
   http://localhost:5173
   ```
5. Copy your Client ID

---

## Update Your .env File

1. **Open:** `c:\Users\SSN\Desktop\mylogin\.env`

2. **Replace this:**
   ```env
   VITE_GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
   ```

   **With your actual Client ID:**
   ```env
   VITE_GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
   ```

3. **Example (what it should look like):**
   ```env
   VITE_GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnopqrstuvwxyz1234.apps.googleusercontent.com
   ```

---

## Restart Everything

```bash
# Terminal 1: Kill and restart frontend
npm run dev

# Terminal 2: Kill and restart backend
cd backend/express/expressapp/APIs
node loginreg.js
```

---

## Test Google Sign-In

1. Go to: http://localhost:5174
2. Click **Register**
3. Click **Sign up with Google**
4. Should work now! ✅

---

## If Still Getting Error 401

**Check these:**

- [ ] Client ID is from Google Cloud Console (not Project ID)
- [ ] Client ID is copied **exactly** - no extra spaces
- [ ] Client ID type is **Web application** (not Android/iOS)
- [ ] Redirect URIs include `http://localhost:5174` and `http://localhost:5173`
- [ ] Frontend restarted after updating .env
- [ ] Browser cache cleared (Ctrl+F5)

**Still stuck?**
- Try creating a new project from scratch
- Make sure Google+ API is ENABLED
- Check that OAuth consent screen is configured

---

## What Your Client ID Should Look Like

✅ **CORRECT FORMAT:**
```
1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
```

❌ **WRONG FORMAT:**
```
YOUR_GOOGLE_CLIENT_ID_HERE
abcd-1234
just-numbers
```

---

## Important Notes

- Your Client ID is public (it's meant to be in client-side code)
- Never share your OAuth Secret with anyone
- For production, you'll need different credentials
- Google may warn "This app isn't verified" - that's normal during development

