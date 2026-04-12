# Base: Node.js 18 slim
FROM node:18-slim

# App directory
WORKDIR /usr/src/app

# Install dependencies (production only)
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy source
COPY . .

# Environment
ENV NODE_ENV=production

# Cloud Run listens on PORT; server.js uses process.env.PORT
EXPOSE 8080

# Start app
CMD ["npm", "start"]