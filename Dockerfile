# Multi-platform Dockerfile for Koyeb.com, Railway, and other platforms
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app source
COPY . .

# Create uploads directory if needed
RUN mkdir -p uploads

# Expose port (Koyeb uses PORT env variable)
EXPOSE $PORT

# Start the application
CMD ["npm", "start"]