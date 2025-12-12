# Get Google Client ID - Step by Step Guide

## Step 1: Go to Google Cloud Console
1. Open: https://console.cloud.google.com/
2. Sign in with your Google account

## Step 2: Create a New Project
1. Click on the project dropdown (top left)
2. Click **"NEW PROJECT"**
3. Enter Project Name: `ISL-Learning-App`
4. Click **CREATE**
5. Wait for the project to be created (takes 1-2 minutes)

## Step 3: Enable Google+ API
1. In the left sidebar, click **APIs & Services** → **Library**
2. Search for: `Google+ API`
3. Click on it
4. Click **ENABLE**

## Step 4: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials** (left sidebar)
2. Click **+ CREATE CREDENTIALS**
3. Select **OAuth 2.0 Client ID**
4. If prompted "To create an OAuth client ID, you must first create an OAuth consent screen":
   - Click **CREATE OAUTH CONSENT SCREEN**
   - Select **External** user type
   - Click **CREATE**

## Step 5: Configure OAuth Consent Screen
1. Fill in the form:
   - **App name**: ISL Learning App
   - **User support email**: Your email
   - **Developer contact information**: Your email
2. Click **SAVE AND CONTINUE**
3. Skip optional fields, keep clicking **SAVE AND CONTINUE**
4. Go back to **Credentials** tab

## Step 6: Create OAuth Client ID
1. Click **+ CREATE CREDENTIALS**
2. Select **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Name: `ISL Learning Web`
5. Under **Authorized redirect URIs**, add these:
   ```
   http://localhost:5173
   http://localhost:5174
   http://localhost:5175
   http://localhost:3000
   ```
   Click **ADD URI** for each one
6. Click **CREATE**

## Step 7: Copy Your Client ID
1. You'll see a popup with your credentials
2. **Copy the Client ID** (looks like: `xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com`)

## Step 8: Update Your .env File
1. Open: `c:\Users\SSN\Desktop\mylogin\.env`
2. Replace:
   ```env
   VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
   ```
   With:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_copied_client_id_here
   ```
3. Save the file

## Step 9: Restart Frontend
```bash
# Kill the current npm run dev if running
# Then run:
npm run dev
```

## Step 10: Test Google Sign-In
1. Go to http://localhost:5174
2. Click Register
3. Click "Sign up with Google"
4. It should work now! ✅

---

## Troubleshooting

**Still getting "OAuth client was not found"?**
- Double-check your Client ID is copied correctly
- Make sure there are no extra spaces in the .env file
- Verify VITE_GOOGLE_CLIENT_ID is the exact Client ID (not your Project ID)
- Restart the frontend after updating .env

**Getting "invalid_client" error?**
- Your Client ID might be from a different project
- Make sure the Client ID is for Web application (not Android/iOS)
- Check that redirect URIs include your localhost port

**"This app isn't verified" warning?**
- This is normal for development
- Click "Continue" or "Go to unsafe link"
- This won't appear after you publish your app

