#!/usr/bin/env bash
# Read-only: is the Subnote dev server on <port> this checkout's, and is it worth driving?
# Usage: doctor.sh [port]   (default 5173). Exit 0 = drive it, 1 = don't.
set -u
port="${1:-5173}"
root="$(git rev-parse --show-toplevel)"
main_root="$(cd "$(git rev-parse --git-common-dir)/.." && pwd)"
ok=1

check() { printf '%-5s %s\n' "$1" "$2"; [ "$1" = ok ] || ok=0; }

[ -d "$root/node_modules" ] && check ok "node_modules installed" ||
	check FAIL "node_modules missing; run: npm install"

[ -f "$root/.svelte-kit/tsconfig.json" ] && check ok ".svelte-kit synced" ||
	check FAIL ".svelte-kit missing; run: npx svelte-kit sync"

if [ "$main_root" != "$root" ]; then
	[ -f "$main_root/.svelte-kit/tsconfig.json" ] && check ok "main checkout .svelte-kit synced (worktrees need it)" ||
		check FAIL "main checkout has no .svelte-kit, so vite in this worktree fails at startup; run: (cd '$main_root' && npx svelte-kit sync)"
fi

html="$(curl -sf --max-time 5 "http://localhost:$port/showcase")"
if [ -z "$html" ]; then
	check FAIL "nothing answers on http://localhost:$port/showcase"
else
	served="$(printf '%s' "$html" | grep -o '/@fs/[^"]*/\.svelte-kit/' | head -1 | sed 's|^/@fs||; s|/\.svelte-kit/$||')"
	if ! printf '%s' "$html" | grep -q '<title>[^<]*Subnote'; then
		check FAIL "port $port serves something that is not Subnote"
	elif [ "$served" != "$root" ]; then
		check FAIL "port $port serves another checkout ($served); use a free port for this one"
	else
		check ok "port $port serves this checkout ($root)"
	fi
fi

[ "$ok" = 1 ] && echo "ready: http://localhost:$port" && exit 0
exit 1
