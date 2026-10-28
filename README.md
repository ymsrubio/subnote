# Subnote

Plans how a paper notebook's pages are divided into Sections. See [GLOSSARY.md](GLOSSARY.md) for the domain words and [docs/design.md](docs/design.md) for the design.

Built with Svelte 5, SvelteKit and [shadcn-svelte](https://shadcn-svelte.com) (ADR 0003).

```sh
npm install
npm run dev      # the app; the design system showcase is at /showcase
npm test         # unit tests, including the design-token check
npm run lint     # prettier and eslint
npm run format   # rewrite files with prettier
npm run check    # svelte-check
npm run build    # static site in build/
```

## Design tokens

- `src/lib/design/tokens.json` is a copy of the Subnote Design System's tokens. Update it from the design system when the tokens change.
- `src/lib/design/tokens.css` declares every token as a CSS variable, light first and dark under `prefers-color-scheme: dark`. `tokens.test.ts` fails if a token is missing or its value differs from `tokens.json`.
- `src/routes/layout.css` hands the tokens to Tailwind (`bg-paper`, `text-section-sage`, …) and defines the type ramp utilities (`type-display` … `type-tab`).
- Showcase examples live in `src/lib/showcase/`; see its README to add one.
