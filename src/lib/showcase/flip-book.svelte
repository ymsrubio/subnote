<script module lang="ts">
	export const title = 'Flip-book';
	export const order = 170;
</script>

<script lang="ts">
	import FlipBook, { type FlipBookPage } from '$lib/components/flip-book.svelte';
	import { sectionColours } from '$lib/design/sections';

	const names = ['Journal', 'Habit tracker', 'Idea capture', 'Calendar', 'Reading log', 'Recipes'];
	const size = 8;

	/** Six Sections of eight Pages after a Free Page, then Free Pages to 56. */
	const pages: FlipBookPage[] = Array.from({ length: 56 }, (_, index) => {
		const number = index + 1;
		const slot = Math.floor((number - 2) / size);
		if (number < 2 || slot >= names.length) return {};
		const first = 2 + slot * size;
		const section = { colour: sectionColours[slot], name: names[slot] };
		return number === first
			? { section, title: true, range: `pp. ${first}–${first + size - 1}` }
			: { section };
	});

	let spread = $state(0);
</script>

<div class="grid gap-4">
	<p class="text-muted-foreground">
		A two-page spread of Pages, 158px wide on a phone and 340px from 768px. Tap a page's outer edge
		or press ← and → to turn one spread. A Section's tab belongs to its Title Page and travels with
		it, and tapping a tab riffles to that Section. Below 560px, tabs drop their names and become
		14px strips. With reduced motion, turns are instant. The component's only inputs are the pages
		and the current spread.
	</p>
	<div class="-mx-4 bg-board px-4 py-10 sm:mx-0 sm:rounded-lg sm:px-8">
		<FlipBook {pages} bind:spread />
	</div>
	<p id="flip-book-state" class="type-caption text-muted-foreground">Spread {spread}</p>
</div>
