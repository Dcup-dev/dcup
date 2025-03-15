# syntax=docker/dockerfile:1
FROM node:23-alpine

# Install required OS packages including Python
RUN apk add --no-cache libc6-compat python3 py3-pip

WORKDIR /app

COPY package.json package-lock.json* ./
COPY scripts/ scripts/

# Install Node dependencies (this runs your postinstall that creates the Python venv)
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_ENV
ENV NEXT_PUBLIC_ENV=${NEXT_PUBLIC_ENV}

# Disable Qdrant connection during build
ENV NEXT_PHASE=phase-production-build

RUN npm run build

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Create non-root user for running the app
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nextjs

EXPOSE 8080

USER nextjs

CMD ["node", "server.js"]
