# Quick Setup for Google Sign-In & CORS Fix

## Issue Fixed ✅
- CORS now accepts multiple frontend ports (5173, 5174, 5175, 3000)
- Backend updated to handle dynamic ports

## What You Need To Do:

### 1. Get Google Client ID
Go to: https://console.cloud.google.com/
- Create a new project
- Enable Google+ API
- Create OAuth 2.0 credentials (Web application)
- Add these Authorized redirect URIs:
  ```
  http://localhost:5173
  http://localhost:5174
  http://localhost:5175
  http://localhost:3000
  ```
- Copy your Client ID

### 2. Update .env file
Edit `c:\Users\SSN\Desktop\mylogin\.env`:
```env
# Replace YOUR_GOOGLE_CLIENT_ID_HERE with your actual Google Client ID
VITE_GOOGLE_CLIENT_ID=your_actual_client_id_from_google_cloud

VITE_API_URL=http://localhost:5000
```

### 3. Restart Everything
```bash
# Kill current processes
# Terminal 1: Frontend dev server
npm run dev

# Terminal 2: Backend API server
cd backend/express/expressapp/APIs
node loginreg.js
```

### 4. Test
- Go to http://localhost:5174 (or whichever port Vite assigns)
- Click on Register
- Try Google Sign-In button
- Should work now! ✅

## Troubleshooting

**Still seeing CORS error?**
- Make sure backend is restarted after CORS changes
- Check that you're using the correct Google Client ID

**Google button says "The given client ID is not found"?**
- Your Client ID is incorrect or not set in .env
- Check VITE_GOOGLE_CLIENT_ID in .env file

**Still getting 401 Unauthorized?**
- This is expected if you're not logged in
- Try registering a new account first
- Or log in with existing credentials

