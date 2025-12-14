#!/bin/sh
set -e

echo "=========================================="
echo "🚀 Starting application..."
echo "=========================================="
echo "Current directory: $(pwd)"
echo "Script location: $0"
echo "DATABASE_URL is ${DATABASE_URL:+set}"

echo ""
echo "🔄 Step 1: Pushing Prisma schema to database..."
npx prisma db push --accept-data-loss --skip-generate || {
  echo "❌ ERROR: prisma db push failed!"
  exit 1
}
echo "✅ Prisma schema pushed successfully!"

echo ""
echo "🔄 Step 2: Starting Next.js application..."
exec pnpm start
