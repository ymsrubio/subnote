#!/usr/bin/env bash
# Push the images in <dir> to the pr-assets/<branch> branch on origin without touching the
# working tree, and print Markdown image links for a PR body.
# Usage: publish-evidence.sh <dir>. Re-running adds or replaces files on the same branch.
set -eu
dir="${1:?usage: publish-evidence.sh <dir>}"
branch="$(git rev-parse --abbrev-ref HEAD)"
assets="pr-assets/${branch//\//-}"
repo="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

entries="$(mktemp)"
parent=()
if git fetch -q origin "refs/heads/$assets" 2>/dev/null; then
	tip="$(git rev-parse FETCH_HEAD)"
	parent=(-p "$tip")
	git ls-tree "$tip" >"$entries"
fi

shopt -s nullglob
files=("$dir"/*.png "$dir"/*.jpg)
[ ${#files[@]} -gt 0 ] || { echo "no .png or .jpg files in $dir" >&2; exit 1; }
for file in "${files[@]}"; do
	name="$(basename "$file")"
	blob="$(git hash-object -w "$file")"
	grep -v "	$name\$" "$entries" >"$entries.new" || true
	printf '100644 blob %s\t%s\n' "$blob" "$name" >>"$entries.new"
	mv "$entries.new" "$entries"
done

tree="$(git mktree <"$entries")"
commit="$(git commit-tree "$tree" ${parent[@]+"${parent[@]}"} -m "chore: verification evidence for $branch")"
git push -q origin "$commit:refs/heads/$assets"
rm -f "$entries"

for file in "${files[@]}"; do
	name="$(basename "$file")"
	echo "![${name%.*}](https://raw.githubusercontent.com/$repo/$commit/$name)"
done
