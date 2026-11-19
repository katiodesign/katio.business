#!/bin/sh
set -eu

: "${DATABASE_URL:?Configura DATABASE_URL}"
: "${NEXTAUTH_URL:?Configura NEXTAUTH_URL}"
: "${NEXTAUTH_SECRET:?Configura NEXTAUTH_SECRET}"
: "${MASTER_KEY:?Configura MASTER_KEY}"
: "${STORAGE_PATH:?Configura almacenamiento persistente}"

node scripts/check-production.mjs
pnpm exec prisma migrate deploy
pnpm db:seed
exec pnpm exec next start --hostname 0.0.0.0 --port "${PORT:-3000}"
