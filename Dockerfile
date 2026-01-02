# Multi-stage build for ISL Learning App

FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies
RUN npm install

# Copy frontend
COPY frontend ./frontend

WORKDIR /app/frontend

# Install frontend dependencies
RUN npm install

# Build frontend
RUN npm run build

# Copy backend
WORKDIR /app
COPY backend ./backend

WORKDIR /app/backend/express/expressapp

# Install backend dependencies
RUN npm install

# Final stage
FROM node:18-alpine

WORKDIR /app

# Install FFmpeg (required for video merging)
RUN apk add --no-cache ffmpeg

# Copy package.json files
COPY --from=builder /app/package*.json ./

# Copy built frontend dist
COPY --from=builder /app/frontend/dist ./frontend/dist

# Copy backend
COPY --from=builder /app/backend ./backend

# Copy root node_modules
COPY --from=builder /app/node_modules ./node_modules

# Install production dependencies for backend
WORKDIR /app/backend/express/expressapp
RUN npm install --production

# Expose port
EXPOSE 8000

# Set environment variables
ENV NODE_ENV=production

# Start the backend server from app directory
WORKDIR /app/backend/express/expressapp

CMD ["node", "server.js"]
