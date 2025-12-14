#!/bin/sh
set -e

echo "🔄 Pushing Prisma schema to database..."
npx prisma db push --accept-data-loss --skip-generate || {
  echo "⚠️  Warning: prisma db push failed, but continuing..."
}

echo "✅ Starting Next.js application..."
exec pnpm start
