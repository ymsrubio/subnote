<script module lang="ts">
	export const title = 'Cover header';
	export const order = 150;
</script>

<script lang="ts">
	import CoverHeader from '$lib/components/cover-header.svelte';
</script>

<p class="text-muted-foreground">
	The notebook's linen cover at the top of the phone screens and the desktop Notebook list. The
	first card lifts over its bottom edge. From 768px the title and counts share one 1120px row.
</p>
<div class="overflow-hidden rounded-lg border pb-6">
	<CoverHeader
		eyebrow="Saved on this device"
		title="Your Notebooks"
		counts={[
			{ value: 2, label: 'Notebooks' },
			{ value: 2, label: 'Pending Sections' }
		]}
		tabs={['sage', 'clay', 'slate', 'teal']}
	>
		<section
			class="grid gap-3 rounded-lg border bg-card p-5 text-card-foreground shadow-(--shadow-sheet) md:p-6"
		>
			<div class="grid gap-1">
				<h2 class="type-title">Waiting for your next Notebook</h2>
				<p class="text-muted-foreground">These didn't fit in Spring notebook.</p>
			</div>
			<p class="flex flex-wrap gap-2">
				<span class="sn-slip sn-sec--plum">Reading log</span>
				<span class="sn-slip sn-sec--sage">Recipes</span>
			</p>
			<button
				type="button"
				class="h-11 justify-self-start rounded-md bg-primary px-4 text-primary-foreground type-label"
			>
				Start next Notebook
			</button>
		</section>
	</CoverHeader>
</div>
