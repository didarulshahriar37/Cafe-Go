FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Expose the stock service port
EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "src/server.js"]
