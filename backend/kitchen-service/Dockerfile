FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Expose the kitchen service port
EXPOSE 3002

ENV NODE_ENV=production
ENV PORT=3002

CMD ["node", "src/server.js"]
