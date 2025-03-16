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

# Add the entrypoint script to the container
COPY docker-entrypoint.sh /usr/local/bin/

# Make sure the entrypoint script is executable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

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
