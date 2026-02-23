# Debian 11 (Bullseye) tem libssl1.1; Bookworm (12) só tem libssl3 e Prisma 5.x exige 1.1
FROM node:20-bullseye-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

FROM node:20-bullseye-slim
RUN apt-get update && apt-get install -y --no-install-recommends libssl1.1 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
RUN mkdir -p /app/data
EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>/dev/null || true && node dist/index.js"]
