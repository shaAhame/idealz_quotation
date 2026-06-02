FROM node:20-slim

# Install Chromium and dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-dejavu-core \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Install dependencies
COPY package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy source
COPY . .

# Build React frontend
RUN cd client && npm run build

# Generate Prisma client
RUN cd server && npx prisma generate

EXPOSE 3001

CMD ["sh", "-c", "cd server && npx prisma generate && npx prisma migrate deploy && node index.js"]
