# ---------- Dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Prisma + Next on Alpine can require these runtime libs
RUN apk add --no-cache libc6-compat openssl

# Keep install layer cache-friendly
COPY package.json package-lock.json* yarn.lock* ./
COPY prisma ./prisma
RUN npm install --frozen-lockfile 2>/dev/null || npm install
RUN npx prisma generate

# ---------- Builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache libc6-compat openssl

# Run app with non-root user
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# Standalone output (next.config.mjs => output: "standalone")
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]