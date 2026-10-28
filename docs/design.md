# Design

Subnote's visual design lives in claude.ai artifacts. They are private to the maintainer: a link opens only for people it has been shared with.

| Artifact | Link | What it holds |
| --- | --- | --- |
| Moodboard | https://claude.ai/artifact/8ZYZ1yw2FguKQpm37tGxHb | The feel, the paper, notebook references, type options, and a working flip-book prototype |
| Subnote Design System | https://claude.ai/artifact/7MCXvwX1Qa2bgN1yyPhTjC | The brand book (README), tokens for both themes, and component previews |
| Design canvas | https://claude.ai/artifact/HQQ9R9JUAdtNhHJ9PyCM2o | Milestone 1 screens for phone and desktop, light and dark: the Notebook list, Setup, Start next Notebook, the Notebook with its flip-book, and adding and removing a Section |

## Decisions

- **Base design system: shadcn-svelte.** Subnote keeps shadcn-svelte's token names (`background`, `primary`, `ring` …), so its components work unchanged, and gives them Subnote's values. Subnote adds its own tokens for the paper, Sections and the book. The design system's README lists every place Subnote departs from the base, and why.
- **A Section shows its colour as an edge band.** Pages stay cream. A Section's colour appears as a strip down each page's outer edge and on its tab. Sections take colours from a fixed palette of six, and neighbours never share one.
- **Type: Nunito and Gaegu**, both from Google Fonts. Nunito is used for the interface. Gaegu is handwriting, used only for Section names and notes written on paper.
- **Light and dark themes.** At night the room goes dark, but the notebook stays paper, only slightly dimmed.

## Screens

The canvas follows one example: Spring notebook (120 pages) gets its Setup, Reading log becomes a Pending Section, Recipes doesn't fit later and Travel does, Idea capture is removed, and Summer notebook's Setup arrives prefilled.

- **Notebook list.** Each Notebook is a card with a page strip that shows every page coloured by Section, its Section names and its counts. Pending Sections sit in their own card with the screen's one primary button, "Start next Notebook". "New Notebook" appears only before the first Notebook exists, so Pending Sections are always carried into the next one. The list says it's saved on this device.
- **Setup is its own screen.** It has an add form ("Section name", "Pages wanted", with a help line about rounding), a page grid of 16 squares a row where each Title Page is filled in its Section's ink, the placed Sections largest first, the Pending Sections with why they didn't fit, and the Free Pages left. "Confirm Setup" opens a Dialog that lists the page to write each Title Page on and says placements never move.
- **Start next Notebook** asks for the name and the page count, then opens Setup prefilled with the previous Notebook's Sections and the Pending Sections. Each row is marked "from Spring" or "was Pending" and can be removed before Setup is confirmed.
- **The Notebook screen holds the flip-book and the add and remove actions.** The Section list doubles as the labelled index of the book. Each placed Section has an options button that leads to "Remove Section". A Dialog with a destructive button says which pages become Free Pages and that writing stays on paper.
- **Add Section shows the result before you add.** When it fits, it shows the range and the Title Page to write on. When it doesn't, it says why ("needs 8 pages in one aligned block, and only 4 Free Pages are left"), and the button reads "Add as Pending Section". A notice on the Notebook screen repeats it afterwards.
- **Section colours are given in placement order in every Notebook**, so a Section's colour can change between Notebooks.

## Layout

- **One responsive layout per screen, with a break point at 768px.**
- **Phone, below 768px:** one column. Forms and Add Section open as a bottom Sheet (shadcn-svelte's Sheet, `side="bottom"`, not yet in the design system). Buttons and fields are 44px tall for touch. The book is a two-page spread with 158px pages. Below 560px, tabs drop their names and become 14px strips (the design system's rule), so the Section list below the book is the named index.
- **Desktop, 768px and wider:** two panes. A 400px side pane holds the lists and forms, and the main pane holds the book or Setup's preview. Sheets become centred Dialogs. Controls use the design system's 36px and 40px sizes. The book is a two-page spread with 340px pages, and tabs show their names along both edges.
- **Setup on desktop** puts the add form and lists in the side pane. The main pane shows the page grid with page numbers down the side and each Section's name next to the row its Title Page is in, with "Confirm Setup" below it.
- **The cover header.** On the phone screens (the Notebook list, the Notebook and Setup) and on the desktop Notebook list, the top of the screen is the notebook's linen `cover`, with an elastic band and Section tabs peeking from its edge. It holds a 34px title (40px on desktop) and large counts such as pages, Sections and Free Pages. The first card, or the open book, overlaps its bottom edge like a sheet of paper.
- **Kept from the design system on purpose:** 8px corners on cards (paper has crisp corners), and no bottom tab bar, because there are only two places to go: the Notebook list and a Notebook.

## Open

- Publish the night version of the desktop Notebook screen (`DeskDarkNotebook`). Its spot on the canvas is empty because the publish was blocked.
- Add a CoverHeader component and a `cover-foreground` token (`#f6f1e4` text, `#d5dccf` secondary) to the design system. The canvas hard-codes these for now.
- Add the bottom Sheet and the page grid to the design system.
- A first-visit screen with one large cover illustration and a big headline, before the first Notebook exists.
- The user's feedback on the cover header and the desktop layouts is still pending.

## Flip-book

The moodboard's prototype settles how the flip-book should work. These rules carry into the real component:

- Page turns are hand-written CSS 3D, not a page-flip library or WebGL, so pages stay live HTML.
- A turning page is a chain of thin vertical strips, each hinged on the one before, so it curls.
- One spring drives every turn (stiffness 95, damping ratio 0.86): following a drag, settling after release, taps and arrow keys. Tapping a tab riffles several pages at once.
- A Section's tab belongs to its Title Page and travels with it during a turn.
- Everything on a page is sized from the page's width, never from percentages, because a page cut into strips would otherwise measure the strip.
- The flip-book component takes the pages and the current spread, and nothing else. Placing Sections stays in its own module.
- With reduced motion, turns are instant.
