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

# Prefer logged-in CLI; fall back to VERCEL_TOKEN when provided.
if [[ -n "${VERCEL_TOKEN:-}" ]]; then
  npx --yes vercel@58.9.0 pull --yes --environment=production --token "$VERCEL_TOKEN" || true
  npx --yes vercel@58.9.0 deploy --prod --yes --token "$VERCEL_TOKEN"
else
  npx --yes vercel@58.9.0 pull --yes --environment=production || true
  npx --yes vercel@58.9.0 deploy --prod --yes
fi
