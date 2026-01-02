# Multi-stage build for ISL Learning App

FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Clean cache and install root dependencies
RUN npm cache clean --force && npm ci --no-audit

# Copy frontend
COPY frontend ./frontend

WORKDIR /app/frontend

# Clean cache and install frontend dependencies
RUN npm cache clean --force && npm ci --no-audit

# Build frontend
RUN npm run build

# Copy backend
WORKDIR /app
COPY backend ./backend

WORKDIR /app/backend/express/expressapp

# Clean cache and install backend dependencies
RUN npm cache clean --force && npm ci --no-audit

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

WORKDIR /app/backend/express/expressapp

# Install production dependencies only
RUN npm ci --no-audit --only=production

EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the backend server
CMD ["node", "server.js"]
