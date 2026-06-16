# Complete Deployment Setup Guide

## Overview
- **Frontend**: Deployed on Vercel (https://isl-web-app.vercel.app)
- **Backend**: Deployed on Render (https://isl-web-app-2-uxja.onrender.com)
- **Database**: Render PostgreSQL

---

## ✅ STEP 1: Local Testing (Before Deployment)

### 1.1 Update Backend Local Environment
Edit `backend/express/expressapp/.env`:
```env
PGHOST=localhost
PGPORT=3133
PGUSER=postgres
PGPASSWORD="T@a3?n5#"
PGDATABASE=demodb
PORT=5000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175
JWT_SECRET=isl_academy_jwt_secret_key_2024_secure_key_min_32_chars
JWT_EXPIRES_IN=1h
```

### 1.2 Update Frontend Local Environment
Edit `frontend/.env`:
```env
VITE_GOOGLE_CLIENT_ID=204360541296-it8b06ajidvoiuc387jpg5loctan0odr.apps.googleusercontent.com
VITE_API_URL=http://localhost:5000
```

### 1.3 Run Locally
**Terminal 1 - Backend:**
```bash
cd backend/express/expressapp
npm install
npm start
# Should show: "SERVER: config { PORT: 5000, FRONTEND_ORIGINS: [...] }"
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
# Should open on http://localhost:5173
```

### 1.4 Test Login
- Open http://localhost:5173/login
- Try logging in with your test account
- Check browser DevTools Console → Network tab
- Verify API calls go to `http://localhost:5000/api/auth/login`

---

## ✅ STEP 2: Setup on Render (Backend)

### 2.1 Go to Render Dashboard
1. Visit https://render.com/dashboard
2. Click on your backend service `isl-web-app-2-uxja`

### 2.2 Add Environment Variables
1. Click **Environment** tab
2. Add/Update these variables:

| Key | Value |
|-----|-------|
| `PORT` | `10000` |
| `NODE_ENV` | `production` |
| `FRONTEND_ORIGIN` | `https://isl-web-app.vercel.app` |
| `JWT_SECRET` | `isl_academy_jwt_secret_key_2024_secure_key_min_32_chars` |
| `JWT_EXPIRES_IN` | `1h` |
| `DATABASE_URL` | (Your Render PostgreSQL connection string - should already be set) |

✅ **IMPORTANT**: Make sure `DATABASE_URL` is already configured for Render PostgreSQL with SSL enabled.

### 2.3 Deploy
1. Click **Manual Deploy** → **Deploy latest commit**
2. Wait for deployment to complete (green checkmark)
3. Note the URL: `https://isl-web-app-2-uxja.onrender.com`

### 2.4 Verify Backend is Working
```bash
# Test from terminal or Postman
curl -X GET https://isl-web-app-2-uxja.onrender.com/api/lessons/modules \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ STEP 3: Setup on Vercel (Frontend)

### 3.1 Go to Vercel Dashboard
1. Visit https://vercel.com/dashboard
2. Click on your project `isl-web-app`

### 3.2 Add Environment Variables
1. Click **Settings** → **Environment Variables**
2. Add these variables:

| Key | Value | Environments |
|-----|-------|---|
| `VITE_API_URL` | `https://isl-web-app-2-uxja.onrender.com` | Production |
| `VITE_GOOGLE_CLIENT_ID` | `204360541296-it8b06ajidvoiuc387jpg5loctan0odr.apps.googleusercontent.com` | Production |

### 3.3 Rebuild and Deploy
1. Click **Deployments** tab
2. Click the latest deployment
3. Click **Redeploy** button (or wait for auto-redeploy if pushed to GitHub)
4. Wait for build to complete

### 3.4 Verify Frontend is Working
1. Open https://isl-web-app.vercel.app
2. Open DevTools → Console tab
3. Should see: NO CORS errors
4. Try login → should work!

---

## ✅ STEP 4: Troubleshooting

### Issue 1: CSS 404 Error
**Symptom**: `https://isl-web-app.vercel.app/index.css (404 Not Found)`

**Fix**:
1. Verify `frontend/vite.config.js` has correct `outDir: 'dist'`
2. Run locally: `npm run build`
3. Check `frontend/dist/` folder exists and has files
4. Push to GitHub and trigger Vercel rebuild

### Issue 2: API 500 Error (Internal Server Error)
**Symptom**: `POST https://isl-web-app-2-uxja.onrender.com/api/auth/login 500`

**Fix**:
1. Check Render environment variables are set (especially `FRONTEND_ORIGIN`)
2. Check Render PostgreSQL `DATABASE_URL` is set and valid
3. View Render logs:
   - Go to Render dashboard → service → Logs tab
   - Look for database connection errors
   - Look for JWT secret errors

### Issue 3: CORS Error
**Symptom**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Fix**:
1. Verify `FRONTEND_ORIGIN` on Render is set to: `https://isl-web-app.vercel.app`
2. Make sure Render backend is redeployed after env var change
3. Check browser DevTools → Network → click on failed request → look at "Access-Control-Allow-Origin" header

### Issue 4: Login Fails Even After CORS Fix
**Symptom**: CORS passes, but login endpoint returns 500

**Fix**:
1. Check database connection in Render logs
2. Verify `DATABASE_URL` environment variable is set
3. Run database migrations on Render if needed:
   ```bash
   # SSH into Render service and run:
   cd backend/express/expressapp
   node migrations/run.js
   ```

---

## 📋 Quick Checklist

- [ ] Backend `.env` has `FRONTEND_ORIGIN=https://isl-web-app.vercel.app`
- [ ] Frontend `.env.production` has `VITE_API_URL=https://isl-web-app-2-uxja.onrender.com`
- [ ] Render environment variables updated
- [ ] Render redeployed
- [ ] Vercel environment variables updated
- [ ] Vercel redeployed
- [ ] Local testing works: `npm run dev` in frontend and backend
- [ ] Production testing: Login works on https://isl-web-app.vercel.app
- [ ] API calls visible in Network tab going to `https://isl-web-app-2-uxja.onrender.com`

---

## 🔗 Important URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://isl-web-app.vercel.app |
| Backend (Render) | https://isl-web-app-2-uxja.onrender.com |
| Render Dashboard | https://render.com/dashboard |
| Vercel Dashboard | https://vercel.com/dashboard |
| Google OAuth Console | https://console.cloud.google.com/ |

---

## 📞 Support
If you encounter issues:
1. Check the "Troubleshooting" section above
2. Review Render logs (Render Dashboard → Logs tab)
3. Check browser DevTools Console and Network tabs
4. Verify all environment variables match this guide
