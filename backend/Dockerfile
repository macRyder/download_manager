# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Stage 2: Production image
FROM node:22-alpine
RUN apk add --no-cache aria2
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create data and logs dirs
RUN mkdir -p data logs

EXPOSE 5000

CMD ["node", "server.js"]
