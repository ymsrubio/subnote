# Design

Subnote's visual design lives in claude.ai artifacts. They are private to the maintainer: a link opens only for people it has been shared with.

| Artifact | Link | What it holds |
| --- | --- | --- |
| Moodboard | https://claude.ai/artifact/8ZYZ1yw2FguKQpm37tGxHb | The feel, the paper, notebook references, type options, and a working flip-book prototype |
| Subnote Design System | https://claude.ai/artifact/7MCXvwX1Qa2bgN1yyPhTjC | The brand book (README), tokens for both themes, and component previews |
| Design canvas | https://claude.ai/artifact/HQQ9R9JUAdtNhHJ9PyCM2o | Milestone 1 screens for phone and desktop, light and dark: the first visit, the first Notebook, the Notebook list, Setup, Start next Notebook, the Notebook with its flip-book, and adding and removing a Section |

## Decisions

- **Base design system: shadcn-svelte.** Subnote keeps shadcn-svelte's token names (`background`, `primary`, `ring` …), so its components work unchanged, and gives them Subnote's values. Subnote adds its own tokens for the paper, Sections and the book. The design system's README lists every place Subnote departs from the base, and why.
- **A Section shows its colour as an edge band.** Pages stay cream. A Section's colour appears as a strip down each page's outer edge and on its tab. Sections take colours from a fixed palette of six, and neighbours never share one.
- **Type: Nunito and Gaegu**, both from Google Fonts. Nunito is used for the interface. Gaegu is handwriting, used only for Section names and notes written on paper.
- **Light and dark themes.** At night the room goes dark, but the notebook stays paper, only slightly dimmed. The six Section inks and tints have night values: tints dim by the same step as the paper, and inks go a touch darker, so a name reaches 4.5:1 on its tint or on paper in both themes.
- **Colour direction B, "Linen binder".** Screens are built as the notebook's own linen `cover` holding the lists, with the open book resting on a desk. Separation comes from material, not lines.
  - **Linen** (`sn-linen`) is the surface for a Notebook's lists, with text in `cover-foreground` and `cover-muted-foreground`. Linen is the same in both themes.
  - **Slips.** Each Section in a list is a slip of its `section-<name>-tint` paper on the linen, with `shadow-slip`. The selected slip sticks out 8px further with `shadow-slip-raised`, like its tab in the book. Free Pages and Pending Sections are plain `paper` slips.
  - **The book sits on a `board`** (`#2a322e`) on linen, with the deeper `shadow-book-on-cover`. On the desk it keeps `cover` and `shadow-book`.
  - **The desk** (`desk`) is the main pane on desktop, with quiet text in `desk-muted-foreground`.
  - **New tokens:** `desk`, `desk-muted-foreground`, `slip-foreground`, `slip-muted-foreground` (slips stay dark in both themes because they are paper), `board`, `elastic` (the cover's band, no longer hard-coded), and the shadows `shadow-book-on-cover`, `shadow-slip`, `shadow-slip-raised` and `shadow-pane`. The cover header also adds `cover-foreground` and `cover-muted-foreground` and the type styles `cover-title`, `cover-title-wide` and `cover-count`.
  - **One main action per screen.** In the room it is a `primary` button. On linen it is a paper button (`sn-btn--paper`). A main action that can't work yet is disabled, with the reason beside it.
- **A Section's name always sits on paper.** On a page, a tab or a slip it is the Section's ink on its tint or on paper. In the room (a card, a dialog or sheet, the page grid) it sits on a small tint slip (`sn-slip`). It is never bare coloured text on a card or on linen.
- **Stacking order.** Page content (the side pane, the book and its tabs) is lowest, then the `scrim`, then the Sheet or Dialog. The book has `isolation: isolate`, so a tab's `z-index` stays inside it, and the scrim dims the tabs too.

## Screens

The canvas follows one example: Spring notebook (120 pages) gets its Setup, Reading log becomes a Pending Section, Recipes doesn't fit later and Travel does, Idea capture is removed, and Summer notebook's Setup arrives prefilled.

- **First visit.** Before any Notebook exists, the screen is the room, not linen: a closed notebook drawn large on `background`, the headline "Give every page a purpose", and one primary "New Notebook" button. It leads to the first-Notebook sheet.
- **First Notebook.** "New Notebook" opens the Sheet (a Dialog on desktop) asking for the name and the page count ("Spring notebook", 120). It then opens an empty Setup: all 120 Pages are Free Pages and "Confirm Setup" is disabled until a Section is added.
- **Notebook list.** Each Notebook is a card with a page strip that shows every page coloured by Section, its Section names (on slips) and its counts. Pending Sections sit in their own card with the screen's one main button, "Start next Notebook". "New Notebook" appears only before the first Notebook exists, so Pending Sections are always carried into the next one. The list says it's saved on this device.
- **Setup is its own screen.** It has an add form ("Section name", "Pages wanted", with a help line about rounding), a page grid of 16 squares a row where each Section's pages are its tint with a 2px ink band and each Title Page is filled in its Section's ink, the placed Sections largest first, the Pending Sections with why they didn't fit, and the Free Pages left. "Confirm Setup" opens a Dialog that lists the page to write each Title Page on and says placements never move.
- **Start next Notebook** asks for the name and the page count, then opens Setup prefilled with the previous Notebook's Sections and the Pending Sections. Each row is marked "from Spring" or "was Pending" and can be removed before Setup is confirmed.
- **The Notebook screen holds the flip-book and the add and remove actions.** The Section list, as slips on the linen, doubles as the labelled index of the book. Each placed Section has an options button that leads to "Remove Section". A Dialog with a destructive button says which pages become Free Pages and that writing stays on paper.
- **Add Section shows the result before you add.** When it fits, it shows the range and the Title Page to write on. When it doesn't, it says why ("needs 8 pages in one aligned block, and only 4 Free Pages are left"), and the button reads "Add as Pending Section". A notice on the Notebook screen repeats it afterwards.
- **Section colours are given in placement order in every Notebook**, so a Section's colour can change between Notebooks.

## Layout

- **One responsive layout per screen, with a break point at 768px.**
- **Phone, below 768px:** one column. Forms and Add Section open as a bottom Sheet (the design system's Sheet). Buttons and fields are 44px tall for touch. The surface is linen from the cover header down to the bottom of the screen, and the book lies on it on its `board`. The book is a two-page spread with 158px pages. Below 560px, tabs drop their names and become 14px strips (the design system's rule), so the Section slips below the book are the named index.
- **Desktop, 768px and wider:** two panes. A 400px linen side pane, full height, holds the lists and forms, and the main pane is the desk, holding the book or Setup's preview. **Notebook and Setup have no top bar:** "Your Notebooks" (the way back) sits at the top of the linen pane. Sheets become centred Dialogs. Controls use the design system's 36px and 40px sizes. The book is a two-page spread with 340px pages, and tabs show their names along both edges.
- **Setup on desktop** puts the add form and lists in the side pane. The main pane shows the page grid with page numbers down the side and each Section's name, on its slip, next to the row its Title Page is in, with "Confirm Setup" below it. The grid shows numbers and names only when it is 680px wide or more.
- **The cover header (CoverHeader).** On the phone screens (the Notebook list, the Notebook and Setup) and on the desktop Notebook list, the top of the screen is the notebook's linen `cover`, with an `elastic` band and Section tabs peeking from its edge. It holds a title in `cover-title` (34px, `cover-title-wide` at 40px on desktop) and large counts in `cover-count`, such as pages, Sections and Free Pages. The first card, or the open book, overlaps its bottom edge like a sheet of paper. The desktop Notebook and Setup use the linen pane instead.
- **The first visit is the room, not linen,** on phone and desktop.
- **Kept from the design system on purpose:** 8px corners on cards (paper has crisp corners), and no bottom tab bar, because there are only two places to go: the Notebook list and a Notebook.

## Open

- Desktop Setup for the next Notebook (`DeskNextNotebook`): the side pane overflows at 960px tall (six slips plus the note).

## Flip-book

The moodboard's prototype settles how the flip-book should work. These rules carry into the real component:

- Page turns are hand-written CSS 3D, not a page-flip library or WebGL, so pages stay live HTML.
- A turning page is a chain of thin vertical strips, each hinged on the one before, so it curls.
- One spring drives every turn (stiffness 95, damping ratio 0.86): following a drag, settling after release, taps and arrow keys. Tapping a tab riffles several pages at once.
- A Section's tab belongs to its Title Page and travels with it during a turn.
- Everything on a page is sized from the page's width, never from percentages, because a page cut into strips would otherwise measure the strip.
- The flip-book component takes the pages and the current spread, and nothing else. Placing Sections stays in its own module.
- With reduced motion, turns are instant.
