# Theme and width

Every Subnote screen follows the system's light or dark setting and has one responsive layout, with a break point at 768px. At night the room goes dark but paper stays cream, slightly dimmed, and the linen cover, `elastic` and `board` don't change. On a phone nothing scrolls sideways.

## Sub-features

- `theme-light` and `theme-dark` follow `prefers-color-scheme`. There is no toggle.
- `theme-paper` keeps paper cream in dark, and keeps cover colours the same in both themes.
- `width-phone` (375) shows one column with no horizontal scroll.
- `width-break` (768) is where desktop sizes start, for example `cover-title-wide`, 36/40px controls, and Sheets becoming Dialogs.
- `width-desktop` (1280) is the wide layout.

## How to get to it (user POV)

- Switch the operating system between light and dark, then reload any route.
- Open any route on a phone, a tablet or a desktop window.

## Driving it with shoot.mjs and the browser pane

Preconditions:

- Doctor passes on `<port>`.

- **Theme switches.** Run `shoot.mjs --url http://localhost:<port>/showcase --scheme dark --eval '({ dark: matchMedia("(prefers-color-scheme: dark)").matches, bg: getComputedStyle(document.body).backgroundColor })'`, then again with `--scheme light`. `dark` is `true` and then `false`, and `bg` differs between the two runs.
- **Readable in both.** With `--eval-file .claude/skills/verify/scripts/contrast.js`, evaluate `snContrast("h1")` and `snContrast("header p")` in each scheme. Both are at least 4.5.
- **No sideways scroll on a phone.** Run with `--width 375 --height 812` and evaluate `document.documentElement.scrollWidth`. It is `375`.
- **Break point.** Run the changed screen at `767` and `768` wide and compare the measured size that the design says changes there.
- **Proof.** Save `<route>-375-light.png`, `<route>-375-dark.png`, `<route>-1280-light.png` and `<route>-1280-dark.png` into `.verify/<run>/`, with the JSON.

## Gotchas

- `resize_window` in the browser pane resets the colour scheme when the app's theme changes. Set `colorScheme` again after any reload, or use `shoot.mjs`, which sets it on every run.
- The `mobile` preset also switches to a touch user agent. Reload after switching so load-time checks run again.
