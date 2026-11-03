# Design-system showcase

`/showcase` shows Subnote's tokens and components, one section per example, with an index of links at the top. Every design-system ticket adds its example here, so this is where most changes get verified.

## Sub-features

- `showcase-index` lists one link per example in the `Examples` navigation, in `order`.
- `showcase-anchor` opens straight at an example with `/showcase#<id>`.
- `showcase-example` renders each example section with its title as an `h2`.

## How to get to it (user POV)

- Open `http://localhost:<port>/showcase`, or follow `Design system showcase` from the home page.
- Open `http://localhost:<port>/showcase#<id>`, where `<id>` is the example's file name in `src/lib/showcase/` (for example `colour`, `type`, `spacing`, `shape`).

## Driving it with shoot.mjs and the browser pane

Preconditions:

- Doctor passes on `<port>`.

- **Index matches sections.** Run `shoot.mjs --url http://localhost:<port>/showcase --eval '({ links: [...document.querySelectorAll("nav[aria-label=Examples] a")].map(a => a.getAttribute("href")), sections: [...document.querySelectorAll("main > section")].map(s => s.id) })'`. Every section id appears in `links` as `#<id>`, in the same order.
- **Anchor.** In the browser pane, `navigate` to `/showcase#<id>`, then run `javascript_tool` with `document.getElementById("<id>").getBoundingClientRect().top`. The value is small (about 16px, from `scroll-mt-4`), so the section is at the top of the viewport.
- **Example.** Screenshot the changed example at each width and scheme, for example `shoot.mjs --url http://localhost:<port>/showcase#<id> --width 375 --height 812 --scheme dark --out .verify/<run>/<id>-375-dark.png`. Then measure what its ticket's acceptance criteria name, with `--eval` and `snContrast`.
- **Proof.** Save the screenshots and the `--eval` JSON into `.verify/<run>/`.

## Gotchas

- A new example shows up only if its `<script module>` exports `title` and `order`. A missing section is usually a missing export, not a routing bug.
- The last example can't scroll to the top, because the page ends first. Its `top` stays large while the window is scrolled to the bottom. Check `scrollY + innerHeight` against `scrollHeight` before calling the anchor broken.
- `--full` screenshots of the whole showcase run over 8000px tall at phone width. Screenshot the one example by anchor, without `--full`, unless the whole page is the point.
- The colour example shows tokens as swatches. Contrast criteria are about real text on real surfaces, so measure the component, not its swatch.
