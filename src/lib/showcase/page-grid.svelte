<script module lang="ts">
	export const title = 'Page grid';
	export const order = 160;
</script>

<script lang="ts">
	import PageGrid from '$lib/components/page-grid.svelte';
	import type { GridSection } from '$lib/design/page-grid';

	const sections: GridSection[] = [
		{ name: 'Journal', colour: 'sage', first: 1, size: 64 },
		{ name: 'Budget', colour: 'ochre', first: 65, size: 8 },
		{ name: 'Garden', colour: 'teal', first: 73, size: 8 },
		{ name: 'Projects', colour: 'slate', first: 81, size: 24 }
	];

	const crowded: GridSection[] = [
		{ name: 'Journal', colour: 'sage', first: 1, size: 64 },
		{ name: 'Budget', colour: 'ochre', first: 65, size: 8 },
		{ name: 'Garden', colour: 'teal', first: 73, size: 7 },
		{ name: 'Note', colour: 'clay', first: 80, size: 1 },
		{ name: 'Spring trip planning, packing and booking list', colour: 'plum', first: 81, size: 8 }
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
<p class="text-muted-foreground">
	Two Title Pages in one row, a Section name too long for its column, and a Section of one page.
	Rows stay the same height and the names column grows to fit up to 18rem, then shortens a name with
	an ellipsis.
</p>
<PageGrid name="Spring notebook" pageCount={120} sections={crowded} />
