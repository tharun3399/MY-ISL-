#!/bin/bash

# Railway Deployment Quick Start Script
# This script helps you prepare your app for Railway deployment

echo "🚀 ISL Learning App - Railway Deployment Preparation"
echo "=================================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found!"
    echo "Please run: git init"
    exit 1
fi

echo "✅ Git repository found"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found in root directory!"
    exit 1
fi

echo "✅ package.json found"

# Check environment file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating .env.example"
    cat > .env.example << 'EOF'
PORT=5000
FRONTEND=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_NAME=isl_learning
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_id
EOF
    echo "✅ Created .env.example"
fi

# Install all dependencies
echo ""
echo "📦 Installing dependencies..."
npm run install:all

# Build frontend
echo ""
echo "🔨 Building frontend..."
npm run build:frontend

echo ""
echo "=================================================="
echo "✅ Preparation Complete!"
echo ""
echo "Next steps:"
echo "1. Update your environment variables in Railway Dashboard"
echo "2. Push to GitHub: git push"
echo "3. Create a Railway project and connect your GitHub repo"
echo "4. Railway will auto-deploy when you push changes"
echo ""
echo "📖 For detailed instructions, see: RAILWAY_DEPLOYMENT.md"
echo "=================================================="
