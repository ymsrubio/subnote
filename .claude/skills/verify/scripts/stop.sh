#!/usr/bin/env bash
# Stop the dev server that launch.sh started on <port>. Only kills the pid launch.sh recorded,
# and only if it is still a vite process. Evidence in .verify/ is left alone.
set -u
port="${1:?usage: stop.sh <port>}"
state="${TMPDIR:-/tmp}/subnote-verify/$port"
pid="$(cat "$state/pid" 2>/dev/null)"

if [ -z "$pid" ]; then
	echo "no server recorded for port $port; nothing to stop"
	exit 0
fi
if ps -o command= -p "$pid" | grep -q 'vite'; then
	kill "$pid"
	echo "stopped vite (pid $pid) on port $port"
else
	echo "pid $pid is no longer vite; not killing it"
fi
rm -rf "$state"
