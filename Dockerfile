FROM node:22-bookworm-slim AS dependencies
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_ADMIN_API_BASE_URL

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_ADMIN_API_BASE_URL=$NEXT_PUBLIC_ADMIN_API_BASE_URL

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]