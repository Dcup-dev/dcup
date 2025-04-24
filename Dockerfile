# syntax=docker/dockerfile:1
FROM node:23-alpine

LABEL org.opencontainers.image.source="https://github.com/Dcup-dev/dcup"
LABEL org.opencontainers.image.description="Dcup RAG-as-a-Service platform"
LABEL org.opencontainers.image.licenses="GPL-3.0"
LABEL org.opencontainers.image.title="Dcup RAG-as-a-Service"
LABEL org.opencontainers.image.version="v1.1.0-beta"
LABEL org.opencontainers.image.authors="Ali Amer <aliamer19ali@gmail.com>"
# Install required OS packages including Python
RUN apk add --no-cache libc6-compat python3 py3-pip

WORKDIR /app

COPY package.json package-lock.json* ./
COPY scripts/ scripts/

# Install Node dependencies (this runs your postinstall that creates the Python venv)
RUN npm ci

COPY . .

# Add the entrypoint script to the container
COPY docker-entrypoint.sh /usr/local/bin/

# Make sure the entrypoint script is executable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV OPENAI_API_KEY=openai-api-key-for-build
ENV REDIS_HOST=just-for-build-only
ENV REDIS_PORT=6379

RUN npm run build

RUN cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Create non-root user for running the app
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 nextjs

EXPOSE 8080

USER nextjs

ENTRYPOINT ["docker-entrypoint.sh"]
