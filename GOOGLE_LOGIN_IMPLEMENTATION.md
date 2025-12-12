# Google Sign-In Implementation for Login Page

## Overview
Google Sign-In has been successfully added to the Login page, allowing users to sign in using their Google accounts without needing to remember their password.

## Changes Made

### 1. Frontend - LoginPage.jsx (`src/components/Login/LoginPage.jsx`)

#### New Imports
```javascript
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
```

#### New Function: `handleGoogleSuccess(credentialResponse)`
- Decodes the Google JWT credential
- Extracts user email and google_id
- Sends authentication request to backend `/login` endpoint with:
  - `email`: User's Google email
  - `google_id`: Google's unique user ID (sub)
  - `is_google_auth`: Boolean flag (true)
- Updates AuthContext on success
- Redirects to dashboard after successful login
- Handles errors and displays error messages

#### UI Changes
- Replaced placeholder `SocialButton` with actual `GoogleLogin` component
- Google button maintains styling from divider section
- Error handling integrated with existing error state

### 2. Backend - loginreg.js (`backend/express/expressapp/APIs/loginreg.js`)

#### Updated `/login` Endpoint
The login endpoint now handles two authentication flows:

**Flow 1: Google Authentication**
- Checks for `is_google_auth` and `google_id` in request body
- Validates email format
- Queries database for user with matching email OR google_id
- Verifies google_id matches if account was Google-created
- Returns error if user account not found (must register first)
- Creates JWT token and httpOnly cookie
- Returns success response with user data

**Flow 2: Traditional Email/Password Authentication** (unchanged)
- Existing email/password logic remains the same
- Full backward compatibility maintained

#### Database Query Enhancement
- Updated SELECT query to retrieve `google_id`, `is_google_auth`, and `profile_picture` columns
- Supports finding users by either email OR google_id

## How It Works

### User Login Flow with Google
1. User clicks "Sign in with Google" button on login page
2. Google OAuth popup appears
3. User signs in with their Google account
4. `handleGoogleSuccess()` callback receives credential token
5. Token is decoded to extract email and google_id
6. Frontend sends authentication request to backend
7. Backend verifies user exists in database
8. Backend creates JWT token and httpOnly cookie
9. Frontend updates AuthContext and redirects to dashboard

### User Registration Flow (Existing)
- Users must first register on the Register page with Google Sign-In
- Creates account with `is_google_auth=true` and stores `google_id`
- After registration, users can login using Google Sign-In on Login page

## Configuration Required

### Google Cloud Console
The following localhost ports must be added as authorized redirect URIs:
- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:5175`
- `http://localhost:3000`

**To add authorized redirect URIs:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to APIs & Services → Credentials
4. Click on your OAuth 2.0 Client ID
5. Under "Authorized redirect URIs", add the above addresses
6. Save changes (allow 1-2 minutes for propagation)

### Environment Variables
Ensure `.env` file contains:
```
VITE_GOOGLE_CLIENT_ID=544857582983-7qkq2o6dcvapcuam9riim672oveiusm8.apps.googleusercontent.com
VITE_API_URL=http://localhost:5000
```

## Testing Steps

1. **Start Backend**: `npm start` in `backend/express/expressapp/`
2. **Start Frontend**: `npm run dev` in root directory
3. **Test Google Login**:
   - Go to `http://localhost:5174/login`
   - Click "Sign in with Google"
   - Complete Google OAuth flow
   - Should redirect to dashboard
   - User data should display in account section

4. **Verify Database**:
   - Check that user record contains:
     - `google_id`: Google's unique identifier
     - `is_google_auth`: true
     - `email`: Google email address

## Error Handling

The following errors may occur and are handled gracefully:

| Error | Cause | Solution |
|-------|-------|----------|
| "Google login failed" | Google OAuth issues | Check Google Client ID in .env |
| "no registered origin" | Port not authorized in Google Cloud Console | Add localhost port to authorized URIs |
| "No account found with this Google email" | User hasn't registered yet | User must register first on Register page |
| "Google account mismatch" | google_id doesn't match database | Try registering again |

## Security Features

- ✅ JWT tokens with expiration (1 hour default)
- ✅ httpOnly cookies (prevents XSS access)
- ✅ Rate limiting on login (5 attempts per 15 minutes)
- ✅ Email validation
- ✅ Parameterized SQL queries (prevents SQL injection)
- ✅ CORS protection with multiple allowed origins
- ✅ Secure password handling for email/password logins

## Files Modified

1. `src/components/Login/LoginPage.jsx` - Added Google Sign-In button and handler
2. `backend/express/expressapp/APIs/loginreg.js` - Added Google auth support to /login endpoint

## Dependencies

Already installed:
- `@react-oauth/google` ^0.12.1
- `jwt-decode` ^3.1.2
- `jsonwebtoken` (backend)
- `bcrypt` (backend)
- `express-rate-limit` (backend)

## Next Steps

1. Add authorized redirect URIs to Google Cloud Console
2. Test complete Google Sign-In flow on both Register and Login pages
3. Verify user data displays correctly in account section
4. Test logout and re-login functionality
