<script module lang="ts">
	export const title = 'Page grid';
	export const order = 160;
</script>

<script lang="ts">
	import PageGrid from '$lib/components/page-grid.svelte';
	import type { GridSection } from '$lib/design/page-grid';

	const sections: GridSection[] = [
		{ name: 'Journal', colour: 'sage', first: 1, last: 64 },
		{ name: 'Budget', colour: 'ochre', first: 65, last: 72 },
		{ name: 'Garden', colour: 'teal', first: 73, last: 80 },
		{ name: 'Projects', colour: 'slate', first: 81, last: 104 }
	];
</script>

<p class="text-muted-foreground">
	Setup's preview of a Notebook: Spring notebook, 120 pages, 16 a row. Page numbers and Section
	names, on slips, appear once the grid itself is 680px wide, whatever the screen.
</p>
<PageGrid name="Spring notebook" pageCount={120} {sections} />
<div class="max-w-90">
	<PageGrid name="Spring notebook" pageCount={120} {sections} />
</div>
