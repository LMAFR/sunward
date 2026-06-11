#!/usr/bin/env bash
# Build with the GitHub Pages base path and force-push to gh-pages.
# Requires GH_TOKEN with Contents write on LMAFR/sunward.
set -euo pipefail
cd "$(dirname "$0")/.."

DEPLOY_BASE=/sunward/ npm run build
cd dist
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy Sunward build $(date -u +%Y-%m-%dT%H:%MZ)"
git push -f "https://x-access-token:${GH_TOKEN}@github.com/LMAFR/sunward.git" gh-pages
cd ..
rm -rf dist/.git

# restore the root-base build so the VPS server (:4173) keeps working
npm run build
echo "Deployed: https://lmafr.github.io/sunward/"
