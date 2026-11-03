# First visit, New Notebook and Setup

`/` decides from what is saved on this device (`localStorage` key `subnote:notebooks:v1`). With no Notebook it shows the first-visit room. With one it goes to `/notebooks/<id>/setup`. The design-system showcase is at `/showcase` and is not linked from here.

## Sub-features

- `first-visit` shows the closed notebook, the headline `Give every page a purpose` and one `New Notebook` button.
- `new-notebook-form` opens a bottom Sheet below 768px and a centred Dialog from 768px. Name and Pages are required, and a page count below 1 shows an error under the field.
- `empty-setup` shows the Notebook's page grid with every Page free, and a disabled `Confirm Setup` with `Add a Section to confirm Setup.` beside it.
- `saved-on-device` returns to the saved Notebook after a reload.

## How to get to it (user POV)

- Open `http://localhost:<port>/` with nothing saved. To start over, run `localStorage.clear()` in the page and reload.

## Driving it with the browser pane

Preconditions:

- Doctor passes on `<port>`, and `localStorage` is empty for that origin (the pane keeps it between visits).

- **First visit.** `navigate` to `/`. The `h1` reads `Give every page a purpose` and `button "New Notebook"` exists.
- **Form.** Click `New Notebook`, then `Start Setup` on the empty form. Errors `Give the Notebook a name` and `Enter how many pages it has` appear under the fields. Measure `[data-slot=input]` heights: 44 below 768px, 36 from 768px. The sheet is `[data-slot=sheet-content]`.
- **Setup.** Fill `Notebook name` and `Pages`, press Enter. The URL becomes `/notebooks/<id>/setup`, the title reads `Setup · <name> · Subnote`, and the visible `Confirm Setup` button is disabled and its `aria-describedby` text is the reason. Phone and desktop render separate trees, so only one is visible at a time.
- **Reload.** `navigate` to `/` again. It lands on the same Setup URL.

## Gotchas

- The screenshot can lag a click by a frame. Take a second one before deciding an error did not render.
- `/notebooks/<id>/...` is not prerendered. The static build serves `200.html` for it, so a host must use that as its fallback.
- The theme follows the system setting only. Set it through emulation.
