# Subnote verification map

This folder is the maintained source for verifying what a Subnote user sees. Read this index, then use the matching feature file as the recipe. When a change adds a route, a screen or a showcase example, add or update its feature file in the same PR.

## Baseline preconditions

- A dev server from this checkout on a free port. Either `preview_start {name: "subnote-dev-5174"}` or `.claude/skills/verify/scripts/launch.sh <port>`.
- `.claude/skills/verify/scripts/doctor.sh <port>` exits 0.
- No data, accounts or seed state. Subnote has no backend yet.

## Driving conventions

- Use `shoot.mjs` for screenshots and measurements, and the browser pane for keyboard, focus and dialogs (see `SKILL.md`).
- Set the colour scheme through emulation. The app has no theme toggle.
- Prefer ARIA roles and names and the `section#<id>` anchors over CSS classes or coordinates.
- Cover `375`, `768` and `1280` wide, in light and dark, for anything visual.

## Proof and skip reporting

- Save artifacts to `.verify/<YYYYMMDD>-<slug>/`, named `<feature>-<width>-<scheme>.png`, with measurements as JSON beside them.
- Record the feature file and entry point with every artifact.
- If a journey can't be driven, report the attempted command and the unmet precondition. Don't report it as verified through a different path.

## Features

- [First visit and Setup](./home.md) covers the first-visit room, the New Notebook Sheet and Dialog, the empty Setup, and the reload.
- [Design-system showcase](./showcase.md) covers the example index, anchors, and each example section.
- [Theme and width](./theme-and-width.md) covers light and dark and the phone, break point and desktop widths, across every route.
