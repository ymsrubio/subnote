<script module lang="ts">
	export interface CoverCount {
		value: number;
		/** What is counted, in the glossary's words: "Free Pages", "Pending Sections". */
		label: string;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { SectionColour } from '$lib/design/sections';

	interface Props {
		eyebrow?: string;
		title: string;
		counts: CoverCount[];
		/** Sections whose tabs peek from the cover's edge. Decoration: only the first four show. */
		tabs?: SectionColour[];
		/** The first card, or the open book, lifted over the cover's bottom edge. */
		children?: Snippet;
	}

	let { eyebrow, title, counts, tabs = [], children }: Props = $props();
</script>

<header
	class="linen relative overflow-hidden bg-cover pt-2 pb-20 text-cover-foreground md:pt-12 md:pb-24"
>
	<span
		aria-hidden="true"
		class="absolute inset-y-0 right-10 w-3 bg-elastic shadow-[inset_2px_0_0_rgb(255_255_255/0.07)] md:right-30"
	></span>
	<span aria-hidden="true" class="absolute top-8 right-0 grid gap-1.5 md:top-10">
		{#each tabs.slice(0, 4) as colour, index (index)}
			<span
				class="sn-sec--{colour} block h-9 w-4 rounded-l-(--radius-tab) bg-(--section-tab) shadow-[inset_4px_0_0_var(--section-ink)]"
			></span>
		{/each}
	</span>
	<div
		class="relative px-5 md:mx-auto md:flex md:max-w-280 md:items-end md:justify-between md:px-8"
	>
		<div>
			{#if eyebrow}
				<p class="tracking-[0.04em] type-caption text-cover-muted-foreground">{eyebrow}</p>
			{/if}
			<h1 class="mt-1 max-w-70 type-cover-title md:max-w-none md:type-cover-title-wide">
				{title}
			</h1>
		</div>
		<dl class="mt-4 flex gap-6 md:mt-0 md:mr-30">
			{#each counts as count (count.label)}
				<div class="flex flex-col-reverse">
					<dt class="type-caption text-cover-muted-foreground">{count.label}</dt>
					<dd class="type-cover-count">{count.value}</dd>
				</div>
			{/each}
		</dl>
	</div>
</header>
{#if children}
	<div class="relative -mt-14 px-4 md:mx-auto md:-mt-16 md:max-w-280 md:px-8">
		{@render children()}
	</div>
{/if}

<style>
	.linen {
		background-image:
			repeating-linear-gradient(0deg, rgb(255 255 255 / 0.035) 0 1px, transparent 1px 3px),
			repeating-linear-gradient(90deg, rgb(0 0 0 / 0.08) 0 1px, transparent 1px 3px);
	}
</style>
