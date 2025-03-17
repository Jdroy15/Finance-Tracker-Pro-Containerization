#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run tests (if any)
echo "🧪 Running tests..."
npm test || true

# Build the application
echo "🔨 Building application..."
npm run build

# Start or restart services
echo "🔄 Restarting services..."
docker-compose down
docker-compose up -d

# Health check
echo "🏥 Performing health check..."
attempts=0
max_attempts=30
until $(curl --output /dev/null --silent --head --fail http://localhost/health); do
    if [ ${attempts} -eq ${max_attempts} ]; then
        echo "❌ Health check failed after ${max_attempts} attempts"
        exit 1
    fi

    printf '.'
    attempts=$(($attempts+1))
    sleep 1
done

echo "✅ Deployment completed successfully!"
