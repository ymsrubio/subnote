#!/usr/bin/env bash
# Start this checkout's dev server on <port> in the background and wait until doctor passes.
# Usage: launch.sh <port>. State (pid, log) goes to $TMPDIR/subnote-verify/<port>/.
set -eu
port="${1:?usage: launch.sh <port>}"
here="$(cd "$(dirname "$0")" && pwd)"
root="$(git rev-parse --show-toplevel)"
state="${TMPDIR:-/tmp}/subnote-verify/$port"

if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
	echo "port $port is taken; run doctor.sh $port to see whose it is, or pick another port" >&2
	exit 1
fi

cd "$root"
[ -d node_modules ] || npm install
npx svelte-kit sync
mkdir -p "$state"
nohup node_modules/.bin/vite dev --port "$port" --strictPort >"$state/vite.log" 2>&1 &
echo $! >"$state/pid"

for _ in $(seq 1 60); do
	if "$here/doctor.sh" "$port" >/dev/null 2>&1; then
		"$here/doctor.sh" "$port"
		exit 0
	fi
	sleep 0.5
done
echo "dev server did not become ready; log: $state/vite.log" >&2
tail -20 "$state/vite.log" >&2
exit 1
