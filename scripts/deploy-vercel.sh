#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Missing VERCEL_TOKEN."
  echo "Create one at https://vercel.com/account/tokens"
  echo "Then: export VERCEL_TOKEN=..."
  exit 1
fi

npm run test
npm run build

npx --yes vercel@39.4.2 pull --yes --environment=production --token "$VERCEL_TOKEN" || true
npx --yes vercel@39.4.2 deploy --prod --yes --token "$VERCEL_TOKEN"
