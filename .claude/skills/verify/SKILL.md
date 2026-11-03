---
name: verify
description: Launch and drive Subnote's SvelteKit web app (home page and the /showcase design-system route) the way a user does, at phone and desktop widths in light and dark, and capture screenshots, measured sizes and contrast ratios as proof. Use after changing anything the browser renders, before opening a PR, or when asked to verify, QA or screenshot Subnote.
---

# Verify Subnote

Subnote is a static SvelteKit app (`adapter-static`, no backend, no auth, no database). The surface is the browser. Its routes are `/` (first visit, or a redirect to the saved Notebook), `/notebooks/<id>/setup` and `/showcase` (every design-system example). Read `features/README.md` for the feature map, then drive the features your change touches.

Scripts live in `.claude/skills/verify/scripts/`. Run them from the checkout you are verifying (the main checkout or a worktree). Paths below are relative to the repo root.

## Launch

Pick a port nobody else is using. `5173` is the default and is often the user's own `npm run dev`. Worktree sessions use `5174`, `5175` or `5176`.

In the Claude desktop app, prefer the browser pane: `preview_start {name: "subnote-dev"}` (5173), or `subnote-dev-5174` / `subnote-dev-5175` from `.claude/launch.json`. Then run doctor on that port.

Anywhere else, or when you need a port with no launch entry:

```bash
.claude/skills/verify/scripts/launch.sh 5176
```

It refuses a taken port, runs `npm install` if `node_modules` is missing, runs `svelte-kit sync`, starts `vite dev --strictPort` in the background, and returns once doctor passes. Ready means doctor prints `ready: http://localhost:<port>`. The pid and `vite.log` are in `$TMPDIR/subnote-verify/<port>/`.

## Doctor

Run it first, and again whenever anything looks off.

```bash
.claude/skills/verify/scripts/doctor.sh 5176
```

It is read-only. It checks `node_modules`, that `.svelte-kit/` is synced, and that the server on the port is Subnote served **from this checkout**. It reads the `/@fs/<checkout>/.svelte-kit/` path out of the page, so a server from another worktree on the same port fails. Exit 0 means drive it. Never drive a server doctor says belongs to another checkout. Start your own on a free port.

## Drive

Two harnesses. Use both as the change needs.

**Headless, scripted (`shoot.mjs`).** Use it for screenshots on disk, measurements, and anything you want rerunnable. It uses the system Chrome (or Playwright's cached Chromium, or `$CHROME`), needs no npm packages, and emulates the viewport and `prefers-color-scheme`.

```bash
.claude/skills/verify/scripts/shoot.mjs --url http://localhost:5176/showcase#type \
  --width 375 --height 812 --scheme dark --full \
  --out .verify/<run>/type-phone-dark.png \
  --eval-file .claude/skills/verify/scripts/contrast.js \
  --eval '({ scrollWidth: document.documentElement.scrollWidth, h1: snContrast("h1") })'
```

- `--eval` prints its result as JSON. Without `--out`, it only measures.
- `contrast.js` defines `snContrast(selectorOrElement, prop = 'color')`. It returns `{fg, bg, ratio}` against the first opaque background behind the element. Pass `'border-top-color'` for borders. It ignores background images such as the linen texture, so check a texture-backed surface against its `background-color`.
- Widths to cover: `375` (phone), `768` (the break point), `1280` (desktop). Section tabs also change below `560`, and the page grid at a `680px` container width.

**Interactive (browser pane, `mcp__Claude_Browser__*`).** Use it for focus, keyboard, dialogs and hover, which a one-shot script can't hold.

- `navigate` to `http://localhost:<port>/showcase#<example-id>`.
- `resize_window {preset: "mobile"}` or `{preset: "desktop"}`, plus `colorScheme: "dark"` or `"light"`. Reset to `desktop` when done.
- Read the page with `read_page` / `find` and act by ref, not by coordinates. Stable handles are each example's `section#<id>` with heading `#<id>-title`, the `nav[aria-label="Examples"]` links, and ARIA roles and names (`button "Remove Section"`, `dialog`).
- Keyboard checks: `computer {action: "key", text: "Tab"}`, then `javascript_tool` with `document.activeElement` and its computed `outline` / `box-shadow`.
- Measure with `javascript_tool`. Paste `scripts/contrast.js` once, then call `snContrast(...)`. Use `getComputedStyle` for sizes and `document.elementFromPoint` for stacking (what covers what).

The theme follows the system setting only. There is no in-app toggle, so always set the scheme through emulation.

## Evidence

Save proof to `.verify/<YYYYMMDD>-<slug>/` at the repo root. It is gitignored and survives cleanup. Create it first (`mkdir -p .verify/<run>`), because a shell redirect into it runs before `shoot.mjs` would create it. Name files `<what>-<width>-<scheme>.png`, and save the JSON from `--eval` next to them (`> .verify/<run>/measure.json`).

Proof standards:

- Drive the real route a user would open (`/showcase#<id>`), not a test-only page. Capture the state before and after an interaction, not only the final screen.
- Cover phone and desktop, light and dark, for anything visual. Report numbers (px, contrast ratios, `scrollWidth`) beside the screenshots, and say whether each was measured or eyeballed.
- `npm run check`, `npm run lint` and `npm test` passing is necessary but is not the proof.

To put screenshots in a PR body, push them to the `pr-assets/<branch>` branch. It doesn't touch your working tree. Then paste the Markdown it prints:

```bash
.claude/skills/verify/scripts/publish-evidence.sh .verify/<run>
```

## Cleanup

```bash
.claude/skills/verify/scripts/stop.sh 5176
```

It kills only the pid `launch.sh` recorded, and only if that pid is still vite. For a browser-pane server, use `preview_stop` with its serverId. Never kill by process name, because the user's own `npm run dev` is usually running. Cleanup leaves `.verify/` alone. Delete a run folder yourself once its evidence is in the PR.

## Gotchas

- **Worktrees need the main checkout synced.** Vite in `.claude/worktrees/<name>/` walks up to the main checkout's `tsconfig.json`, which extends `.svelte-kit/tsconfig.json`. If the main checkout has never run `svelte-kit sync` (or `npm run dev`), vite and vitest stop at startup in every worktree. Doctor checks for this and prints the fix.
- **New showcase examples need no route edit.** `src/lib/showcase/index.ts` globs every `.svelte` file in that folder. If your example is missing, check its `<script module>` exports `title` and `order`.
