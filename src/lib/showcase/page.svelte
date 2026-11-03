<script module lang="ts">
	export const title = 'Page';
	export const order = 160;
</script>

<script lang="ts">
	import Page from '$lib/components/page.svelte';
	import { sectionColours } from '$lib/design/sections';

	const names = {
		sage: 'Recipes',
		clay: 'Garden',
		ochre: 'Reading log',
		slate: 'Work notes',
		plum: 'Ideas',
		teal: 'Travel'
	} as const;
</script>

<p class="text-muted-foreground">
	Paper with a dot grid, curving into the spine. A Title Page names its Section in the Section's
	ink. Other Pages in the Section carry an edge band down the outer edge, and a Free Page has none.
	Every size comes from the page width.
</p>

<div class="grid gap-6">
	{#each sectionColours as colour, index (colour)}
		{@const section = { colour, name: names[colour] }}
		<div
			id={index === 0 ? 'page-ref' : undefined}
			class="flex flex-wrap items-start gap-x-1 gap-y-4"
		>
			<Page number={index * 8 + 2} side="left" width={158} {section} title range="pp. 2–9" />
			<Page number={index * 8 + 3} side="right" width={158} {section} />
			<Page number={index * 8 + 8} side="left" width={158} {section} />
			<Page number={index * 8 + 9} side="right" width={158} {section} title range="pp. 9–16" />
		</div>
	{/each}
</div>

<h3 class="type-title">Free Pages and widths</h3>
<div class="flex flex-wrap items-start gap-x-1 gap-y-4">
	<Page number={40} side="left" width={158} />
	<Page number={41} side="right" width={158} />
	<Page number={42} side="left" width={340} />
	<Page
		number={43}
		side="right"
		width={340}
		section={{ colour: 'sage', name: names.sage }}
		title
		range="pp. 43–50"
	/>
</div>

<h3 class="type-title">In a narrow clipping container</h3>
<p class="text-muted-foreground">
	A 60px window cuts the page, as a flip-book strip will. The layout inside does not move.
</p>
<div id="page-clip" class="h-70 w-15 overflow-hidden rounded border">
	<Page
		number={7}
		side="right"
		width={158}
		section={{ colour: 'teal', name: names.teal }}
		title
		range="pp. 7–12"
	/>
</div>
