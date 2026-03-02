FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Expose the notification service port
EXPOSE 3003

ENV NODE_ENV=production
ENV PORT=3003

CMD ["node", "src/server.js"]
