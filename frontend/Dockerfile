# ---------- Frontend (Next.js) multi-stage Dockerfile ----------

# Base versions
ARG NODE_VERSION=20-alpine

# 1) Dependencies stage
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# Enable pnpm via corepack and install deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable \
 && corepack prepare pnpm@9.12.3 --activate \
 && pnpm i --no-frozen-lockfile

# 2) Build stage
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next
RUN corepack enable \
 && pnpm build

# 3) Production runtime
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Copy build artifacts and minimal files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

# Respect Cloud Run PORT env; bind to 0.0.0.0 for container networking
CMD ["sh", "-c", "node node_modules/next/dist/bin/next start -p ${PORT:-3000} -H 0.0.0.0"]
