# Multi-stage build for ISL Learning App

FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies
RUN npm install --production=false

# Copy frontend
COPY frontend ./frontend

WORKDIR /app/frontend

# Install frontend dependencies
RUN npm install --production=false

# Build frontend
RUN npm run build

# Copy backend
WORKDIR /app
COPY backend ./backend

WORKDIR /app/backend/express/expressapp

# Install backend dependencies
RUN npm install --production=false

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
RUN npm install --production

EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Working directory for start command
WORKDIR /app/backend/express/expressapp

# Start the backend server
CMD ["node", "server.js"]
