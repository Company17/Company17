#!/usr/bin/env bash
# Run from inside the unzipped sitelayer folder. Pushes everything to Company17/Company17 on main.
set -e
git init -b main 2>/dev/null || true
git add -A
git commit -m "SiteLayer: beta candidate code, start code plan, one-week build brief" || true
git remote remove origin 2>/dev/null || true
git remote add origin git@github.com:Company17/Company17.git
git push -u origin main
