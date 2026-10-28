# Design

Subnote's visual design lives in claude.ai artifacts. They are private to the maintainer: a link opens only for people it has been shared with.

| Artifact | Link | What it holds |
| --- | --- | --- |
| Moodboard | https://claude.ai/artifact/8ZYZ1yw2FguKQpm37tGxHb | The feel, the paper, notebook references, type options, and a working flip-book prototype |
| Subnote Design System | https://claude.ai/artifact/7MCXvwX1Qa2bgN1yyPhTjC | The brand book (README), tokens for both themes, and component previews |
| Design canvas | Not created yet | Milestone 1 screens: the Notebook list, Setup, Start next Notebook and the flip-book |

## Decisions

- **Base design system: shadcn-svelte.** Subnote keeps shadcn-svelte's token names (`background`, `primary`, `ring` …), so its components work unchanged, and gives them Subnote's values. Subnote adds its own tokens for the paper, Sections and the book. The design system's README lists every place Subnote departs from the base, and why.
- **A Section shows its colour as an edge band.** Pages stay cream. A Section's colour appears as a strip down each page's outer edge and on its tab. Sections take colours from a fixed palette of six, and neighbours never share one.
- **Type: Nunito and Gaegu**, both from Google Fonts. Nunito is used for the interface. Gaegu is handwriting, used only for Section names and notes written on paper.
- **Light and dark themes.** At night the room goes dark, but the notebook stays paper, only slightly dimmed.

## Flip-book

The moodboard's prototype settles how the flip-book should work. These rules carry into the real component:

- Page turns are hand-written CSS 3D, not a page-flip library or WebGL, so pages stay live HTML.
- A turning page is a chain of thin vertical strips, each hinged on the one before, so it curls.
- One spring drives every turn (stiffness 95, damping ratio 0.86): following a drag, settling after release, taps and arrow keys. Tapping a tab riffles several pages at once.
- A Section's tab belongs to its Title Page and travels with it during a turn.
- Everything on a page is sized from the page's width, never from percentages, because a page cut into strips would otherwise measure the strip.
- The flip-book component takes the pages and the current spread, and nothing else. Placing Sections stays in its own module.
- With reduced motion, turns are instant.
