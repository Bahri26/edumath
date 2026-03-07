# Dockerfile for Edumath Backend
# Multi-stage build for Node.js with Cloud SQL Proxy support

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Create migration directory
RUN mkdir -p migrations

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Run migrations and start server
CMD ["sh", "-c", "npm run migrate && npm start"]
