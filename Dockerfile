# Use official Node image with Chromium pre-installed
FROM ghcr.io/puppeteer/puppeteer:22.4.0

# Set working directory
WORKDIR /app

# Run as root to install deps
USER root

# Copy package files
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

# Install all dependencies
RUN npm install && \
    cd server && npm install && \
    cd ../client && npm install

# Copy all source files
COPY . .

# Build the React frontend
RUN cd client && npm run build

# Generate Prisma client
RUN cd server && npx prisma generate

# Expose port
EXPOSE 3001

# Start command - migrate DB then start server
CMD cd server && npx prisma migrate deploy && node index.js