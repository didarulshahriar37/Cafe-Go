FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies strictly
RUN npm install --omit=dev

# Copy all source code
COPY . .

# Expose the gateway port
EXPOSE 8080

# Environment variables (production mode)
ENV NODE_ENV=production
ENV PORT=8080

# Start command
CMD ["node", "src/server.js"]
