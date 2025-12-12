# Google Sign-In Integration Guide

## Overview
This guide explains how to set up Google Sign-In for the registration page. Users can sign up with their Google account and then enter their phone number and username.

---

## Part 1: Google Cloud Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a Project** → **New Project**
3. Enter project name: `ISL-Learning-App` (or your preferred name)
4. Click **Create**

### Step 2: Enable Google+ API
1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for `Google+ API`
3. Click on it and select **Enable**

### Step 3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. If prompted, select **External** for User Type
4. Click **Create OAuth Consent Screen**
5. Fill in:
   - App name: `ISL Learning App`
   - User support email: your email
   - Developer contact email: your email
   - Click **Save and Continue**
6. Skip optional scopes, click **Save and Continue**
7. Add test users (optional), click **Save and Continue**
8. Go back to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**

### Step 4: Configure OAuth Consent Screen
1. Select **Web application**
2. Name: `ISL Learning App Web Client`
3. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:5173
   http://localhost:5000
   http://localhost:3000
   ```
4. Add your production domain later (e.g., `https://yourdomain.com`)
5. Click **Create**
6. **Copy your Client ID** - you'll need this

---

## Part 2: Frontend Setup

### Step 1: Install Dependencies
```bash
npm install @react-oauth/google
```

### Step 2: Set Environment Variables
Create a `.env` file in the root directory:
```env
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
```

Get your Google Client ID from Step 4 above.

### Step 3: Verify Files Created
The following files should exist:
- ✅ `src/components/Register/RegisterPage.jsx` (updated)
- ✅ `src/components/Register/GoogleSignupComplete.jsx` (new)
- ✅ `src/components/Register/GoogleSignupComplete.css` (new)9+
- ✅ `src/App.jsx` (updated with GoogleOAuthProvider)

---

## Part 3: Backend Setup

### Step 1: Update Database Schema
The backend automatically adds these columns on first Google registration:
- `google_id` - Stores Google user ID
- `is_google_auth` - Boolean flag for Google accounts
- `profile_picture` - URL to Google profile picture

### Step 2: Verify Backend Endpoints
The backend has been updated to handle:
- **POST /register** - Now accepts Google auth data
- **POST /login** - Works with Google accounts
- **GET /profile** - Returns user profile data

---

## Part 4: Testing

### Test Flow:
1. **Start the application**
   ```bash
   npm run dev
   ```

2. **Navigate to Register page**
   - Go to `http://localhost:5173/register`

3. **Click "Sign up with Google"**
   - A Google login popup will appear
   - Sign in with your Google account

4. **Complete Profile**
   - You'll be redirected to `/register/complete`
   - Fill in:
     - Full Name (pre-filled from Google)
     - Username (required)
     - Phone Number (required)
   - Click **Complete Registration**

5. **Auto-Login**
   - User is automatically logged in
   - Redirected to `/dashboard`

---

## User Flow Diagram

```
Register Page
    ↓
[Standard Registration] OR [Sign up with Google]
    ↓
    │
    ├─→ Standard: Submit email/password → Dashboard
    │
    └─→ Google: Decode Google token → Complete Profile Page
                                ↓
                        Enter username & phone
                                ↓
                        Create account & auto-login
                                ↓
                            Dashboard
```

---

## Database Schema Updates

The registration endpoint will automatically add these columns:
```sql
ALTER TABLE UserInfo
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_google_auth BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);
```

No manual migration needed!

---

## Security Features

✅ **Google token validation** - JWT decoded and verified  
✅ **Email verification** - Email comes from verified Google account  
✅ **Password security** - Google ID used as password (hashed with bcrypt)  
✅ **Rate limiting** - 5 login attempts per 15 minutes  
✅ **Input validation** - Phone and username validated  
✅ **HTTPS ready** - Secure cookie flag for production  
✅ **XSS protection** - Input sanitization  

---

## Troubleshooting

### Issue: "Invalid client ID" error
- **Solution**: Verify `REACT_APP_GOOGLE_CLIENT_ID` in `.env` is correct
- Check that the client ID matches your Google Cloud project

### Issue: Google popup doesn't appear
- **Solution**: Check browser console for CORS errors
- Verify redirect URIs in Google Cloud Console include your localhost

### Issue: "User already exists" after Google signup
- **Solution**: This means the email was already registered
- User should log in with existing account instead

### Issue: Phone number validation fails
- **Solution**: Use format like `+1234567890` or `1234567890`
- Must be 8-15 digits

### Issue: User not auto-logged in after registration
- **Solution**: Check backend logs for login endpoint errors
- Verify JWT_SECRET is set in backend `.env`

---

## Environment Variables Checklist

### Frontend (.env)
- [ ] `REACT_APP_GOOGLE_CLIENT_ID` - Your Google OAuth Client ID

### Backend (.env)
- [ ] `PORT` - Backend port (default: 5000)
- [ ] `JWT_SECRET` - Random secret for JWT signing
- [ ] `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Database config
- [ ] `NODE_ENV` - Set to `production` in production

---

## Production Deployment

### Before going live:

1. **Update Google OAuth redirect URIs**
   - Add your production domain to Google Cloud Console

2. **Set environment variables**
   ```bash
   NODE_ENV=production
   REACT_APP_GOOGLE_CLIENT_ID=your_production_client_id
   JWT_SECRET=strong_random_secret_min_32_chars
   ```

3. **Enable HTTPS**
   - Secure cookies require HTTPS in production

4. **Update CORS origin**
   - Set `FRONTEND_ORIGIN` to your production domain

---

## Next Steps

1. ✅ Get Google Client ID
2. ✅ Set `REACT_APP_GOOGLE_CLIENT_ID` in `.env`
3. ✅ Run `npm install` (if dependencies not installed)
4. ✅ Start the application with `npm run dev`
5. ✅ Test the Google Sign-In flow

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Check backend logs in terminal
4. Verify all environment variables are set correctly

