# Home page

The home page at `/` names the app, says in one line what it is for, and links to the design-system showcase. It is a placeholder until the Notebook list screen exists.

## Sub-features

- `home-render` shows the `Subnote` heading and the one-line description.
- `home-to-showcase` follows the `Design system showcase` link to `/showcase`.

## How to get to it (user POV)

- Open `http://localhost:<port>/`.

## Driving it with shoot.mjs and the browser pane

Preconditions:

- Doctor passes on `<port>`.

- **Render.** Run `shoot.mjs --url http://localhost:<port>/ --eval '({ title: document.title, h1: document.querySelector("h1")?.textContent, link: document.querySelector("a")?.getAttribute("href") })'`. The result is `title` `Subnote`, `h1` `Subnote`, and `link` `./showcase` (relative, from `resolve`).
- **Follow the link.** In the browser pane, `navigate` to `/`, `find` the link `Design system showcase`, and click it by ref. The URL becomes `/showcase` and the heading reads `Design system`.
- **Proof.** Run `shoot.mjs --url http://localhost:<port>/ --width 375 --height 812 --scheme light --out .verify/<run>/home-375-light.png`.

## Gotchas

- The page uses `resolve('/showcase')`, which renders a relative `href` (`./showcase`). Assert the URL after clicking, not the `href` string.
