# Railway Deployment Guide

## Prerequisites
- Git repository initialized and pushed to GitHub
- Railway account (railway.app)
- Environment variables configured

## Step 1: Prepare Your Code for Deployment

All necessary files have been created:
- `Procfile` - Tells Railway how to start the app
- `railway.json` - Railway configuration
- Updated `package.json` with `start:prod` script

## Step 2: Set Up Railway

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub account (recommended)

2. **Create a New Project**
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Connect your GitHub account and authorize Railway
   - Select the repository: `mylogin`

3. **Configure Environment Variables**

   In Railway Dashboard, add these environment variables:

   **Backend Variables:**
   ```
   PORT=5000
   FRONTEND=https://your-railway-app.railway.app
   DB_HOST=your-postgres-host
   DB_PORT=5432
   DB_NAME=your-db-name
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   GEMINI_API_KEY=your-gemini-api-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   JWT_SECRET=your-jwt-secret
   ```

   **Frontend Variables:**
   ```
   VITE_API_URL=https://your-api-url.railway.app
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   ```

## Step 3: Configure Services

### Option A: Single Service (Recommended for start)
1. Railway will auto-detect and use the root `package.json`
2. The `start:prod` script will run the backend
3. Deploy the frontend separately on Vercel or Netlify

### Option B: Multiple Services with Docker

Create `docker-compose.yml` in root:
```yaml
version: '3.8'
services:
  backend:
    build:
      context: ./backend/express/expressapp
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=${DB_NAME}
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Create `backend/express/expressapp/Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

## Step 4: Database Setup

### Using Railway PostgreSQL

1. In Railway Dashboard, click "Add Service"
2. Select "PostgreSQL"
3. Railway will automatically inject `DATABASE_URL`
4. Update your backend to use this URL

### Database Connection String
Format: `postgresql://user:password@host:port/database`

## Step 5: Deploy Frontend Separately

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
cd frontend
vercel
```

### Option 2: Netlify
1. Connect GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `VITE_API_URL=your-railway-backend-url`

## Step 6: Deploy Backend

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add Railway deployment configuration"
   git push
   ```

2. **Railway Auto-Deploy:**
   - Railway will automatically deploy when you push to main/master
   - Check deployment logs in Railway Dashboard

3. **Manual Deploy (if needed):**
   ```bash
   railway login
   railway up
   ```

## Step 7: Health Checks

1. Test backend API:
   ```bash
   curl https://your-railway-backend.railway.app/api/health
   ```

2. Test frontend:
   - Visit your frontend URL
   - Check browser console for any CORS errors

## Environment Variables Configuration

### Backend (.env)
```
PORT=5000
FRONTEND=https://your-frontend.vercel.app
DATABASE_URL=postgresql://user:password@host:port/db
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-key
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
```

### Frontend (.env)
```
VITE_API_URL=https://your-railway-backend.railway.app
VITE_GOOGLE_CLIENT_ID=your-id
```

## Troubleshooting

### Build Fails
- Check logs in Railway Dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility (recommend 18+)

### Connection Errors
- Check environment variables are set
- Verify CORS configuration in backend
- Check database connection string format

### FFmpeg Issues
- Railway includes ffmpeg in nixpacks
- If issues persist, use a custom Docker image

## Monitoring

1. **Logs:**
   - View real-time logs in Railway Dashboard
   - Monitor error rates and performance

2. **Metrics:**
   - CPU usage
   - Memory usage
   - Network I/O

3. **Alerts:**
   - Set up notifications for deployment failures

## Cost Optimization

- Railway offers free tier with limitations
- Paid plans start at $5/month
- Monitor usage to avoid unexpected charges

## Support & Resources

- Railway Docs: https://docs.railway.app
- GitHub Integration: https://docs.railway.app/deploy/github
- Database Setup: https://docs.railway.app/databases
