#!/bin/sh
set -e

echo "=========================================="
echo "🚀 Starting application..."
echo "=========================================="

echo ""
echo "🔄 Step 1: Pushing Prisma schema to database..."
echo "   DATABASE_URL is ${DATABASE_URL:+set}"
npx prisma db push --accept-data-loss --skip-generate
echo "✅ Prisma schema pushed successfully!"

echo ""
echo "🔄 Step 2: Starting Next.js application..."
exec pnpm start
