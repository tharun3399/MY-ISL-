@echo off
REM Railway Deployment Quick Start Script for Windows

echo.
echo 🚀 ISL Learning App - Railway Deployment Preparation
echo ==================================================

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Git repository not found!
    echo Please run: git init
    exit /b 1
)

echo ✅ Git repository found

REM Check if package.json exists
if not exist "package.json" (
    echo ❌ package.json not found in root directory!
    exit /b 1
)

echo ✅ package.json found

REM Check environment file
if not exist ".env" (
    echo ⚠️  .env file not found. Creating .env.example
    (
        echo PORT=5000
        echo FRONTEND=http://localhost:5173
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=isl_learning
        echo DB_USER=postgres
        echo DB_PASSWORD=your_password
        echo JWT_SECRET=your_jwt_secret
        echo GEMINI_API_KEY=your_gemini_key
        echo GOOGLE_CLIENT_ID=your_google_id
        echo GOOGLE_CLIENT_SECRET=your_google_secret
        echo VITE_API_URL=http://localhost:5000
        echo VITE_GOOGLE_CLIENT_ID=your_google_id
    ) > .env.example
    echo ✅ Created .env.example
)

REM Install all dependencies
echo.
echo 📦 Installing dependencies...
call npm run install:all

REM Build frontend
echo.
echo 🔨 Building frontend...
call npm run build:frontend

echo.
echo ==================================================
echo ✅ Preparation Complete!
echo.
echo Next steps:
echo 1. Update your environment variables in Railway Dashboard
echo 2. Push to GitHub: git push
echo 3. Create a Railway project and connect your GitHub repo
echo 4. Railway will auto-deploy when you push changes
echo.
echo 📖 For detailed instructions, see: RAILWAY_DEPLOYMENT.md
echo ==================================================
pause
