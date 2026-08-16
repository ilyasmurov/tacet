#!/usr/bin/env bash
#
# Deploys tacet.smurov.com.
#
# The site is static and served by the Caddy that already runs on the host for
# another project, so deploying is: build everything, sync the folder, verify.
# Nothing is restarted — Caddy picks files up as they are.
#
# Usage:  ./scripts/deploy-site.sh
#
set -euo pipefail

HOST="${TACET_DEPLOY_HOST:-root@157.22.194.55}"
TARGET="${TACET_DEPLOY_PATH:-/srv/tacet/}"
URL="${TACET_URL:-https://tacet.smurov.com}"

cd "$(dirname "$0")/.."

echo "→ building packages"
pnpm build >/dev/null

echo "→ running tests"
pnpm test >/dev/null

echo "→ generating svg and semantics"
pnpm svg >/dev/null
pnpm meta >/dev/null

echo "→ building the site"
(cd site && node build.ts)

# --delete keeps the remote free of previous builds: module folders carry a
# content hash in their name, so yesterday's ones would otherwise linger forever.
echo "→ syncing to $HOST"
rsync -az --delete -e "ssh -o BatchMode=yes" site/dist/ "$HOST:$TARGET"

echo "→ verifying"
code=$(curl -sS -o /dev/null -w "%{http_code}" "$URL" --max-time 20)
[ "$code" = "200" ] || { echo "site answered $code"; exit 1; }

# The module path lives in the page; fetching it proves the deploy is coherent —
# a page pointing at modules that are not there is exactly the failure this
# check exists for.
modules=$(curl -sS "$URL" --max-time 20 | grep -o './tacet/[a-f0-9]*/core/index.js' | head -1)
[ -n "$modules" ] || { echo "no module path found in the page"; exit 1; }
mcode=$(curl -sS -o /dev/null -w "%{http_code}" "$URL/${modules#./}" --max-time 20)
[ "$mcode" = "200" ] || { echo "modules answered $mcode at $modules"; exit 1; }

echo "done: $URL — page 200, modules 200 at ${modules}"
