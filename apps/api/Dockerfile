FROM node:24-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

# Copy root workspace and package files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter @workspace/api...

# Copy source code
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared package and api bundle
RUN pnpm --filter @workspace/shared build || true
RUN pnpm --filter @workspace/api build

EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

CMD ["node", "apps/api/dist/index.mjs"]
