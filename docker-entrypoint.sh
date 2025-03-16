#!/bin/sh

# Run the necessary npm commands
echo "Postgres is ready, running npm generate and pushdb..."
npm run pushdb

# Start the Next.js app
echo "Starting Next.js app..."

node .next/standalone/server.js
