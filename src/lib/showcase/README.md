# Showcase examples

The `/showcase` route renders every `.svelte` file in this folder, in `order`. Nothing else needs editing, so examples can be added in parallel.

To add one, create `src/lib/showcase/<name>.svelte` and export its title and position from a module script:

```svelte
<script module lang="ts">
	export const title = 'Button';
	export const order = 100;
</script>

<!-- the example markup -->
```

`order` 10 to 40 are the token examples (colour, type, spacing, radius and shadow). Components start at 100; pick an unused number. The file name becomes the section's anchor (`/showcase#button`).
