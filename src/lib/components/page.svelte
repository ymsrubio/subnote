<script module lang="ts">
	export interface PageSection {
		colour: SectionColour;
		name: string;
	}
</script>

<script lang="ts">
	import type { SectionColour } from '$lib/design/sections';

	type Props = {
		number: number;
		/** Which side of the spread the Page is on: its outer edge is the other side. */
		side: 'left' | 'right';
		/** The Page's width in px. Everything inside is sized from it, never from a container. */
		width: number;
	} & (
		| /** A Free Page: no Section. */ { section?: undefined; title?: false; range?: never }
		| /** A Page in a Section, with its edge band. */ {
				section: PageSection;
				title?: false;
				range?: never;
		  }
		| {
				/** The Section's Title Page: its name, an underline and `range`. */
				section: PageSection;
				title: true;
				/** The Section's page range, written on its Title Page: "pp. 3–10". */
				range?: string;
		  }
	);

	let { number, section, title = false, range, side, width }: Props = $props();
</script>

<!--
	--k is the width over 340, the width the tokens are drawn at, so a size at the 340px page is `calc(Npx * var(--k))` at any width.
-->
<div
	class="sn-page {side === 'left' ? 'sn-page--left' : 'sn-page--right'} {section
		? `sn-sec--${section.colour}`
		: ''}"
	style:--k={width / 340}
	style:width="{width}px"
	style:height="{width * 1.4}px"
>
	{#if section && !title}
		<span class="sn-page__band" aria-hidden="true"></span>
	{/if}
	{#if section && title}
		<div class="sn-page__title">
			<h3 class="sn-page__name">{section.name}</h3>
			<svg
				class="sn-page__stroke"
				viewBox="0 0 200 10"
				aria-hidden="true"
				preserveAspectRatio="none"
			>
				<path
					vector-effect="non-scaling-stroke"
					d="M2 6 C 30 2, 60 8, 100 5 S 170 3, 198 6"
					fill="none"
					stroke="currentColor"
					stroke-width="2.4"
					stroke-linecap="round"
				/>
			</svg>
			{#if range}<p class="sn-page__range">{range}</p>{/if}
		</div>
	{:else if !section}
		<span class="sn-page__free">free</span>
	{/if}
	<span class="sn-page__number">{number}</span>
</div>

<style>
	.sn-page {
		position: relative;
		flex: none;
		overflow: hidden;
		box-sizing: border-box;
		background-color: var(--paper);
		background-image: radial-gradient(
			circle,
			var(--dot) calc(0.8.16px * var(--k)),
			transparent calc(1.1px * var(--k))
		);
		background-size: calc(17px * var(--k)) calc(17px * var(--k));
		background-position: calc(8.5px * var(--k)) calc(8.5px * var(--k));
		color: var(--pencil);
	}
	.sn-page--right {
		border-radius: 0 var(--radius-page) var(--radius-page) 0;
	}
	.sn-page--left {
		border-radius: var(--radius-page) 0 0 var(--radius-page);
	}
	/* The gutter: the page curving into the spine. */
	.sn-page::before {
		content: '';
		position: absolute;
		inset: 0 auto 0 0;
		width: calc(34px * var(--k));
		background: linear-gradient(to right, var(--gutter), transparent);
		pointer-events: none;
	}
	.sn-page--left::before {
		inset: 0 0 0 auto;
		background: linear-gradient(to left, var(--gutter), transparent);
	}
	.sn-page__band {
		position: absolute;
		top: 0;
		bottom: 0;
		right: 0;
		width: calc(8.16px * var(--k));
		background: var(--section-ink);
	}
	.sn-page--left .sn-page__band {
		right: auto;
		left: 0;
	}
	.sn-page__title {
		position: absolute;
		inset: calc(96px * var(--k)) calc(40px * var(--k)) auto;
		display: grid;
		gap: calc(6px * var(--k));
		justify-items: start;
	}
	.sn-page__name {
		margin: 0;
		font-family: var(--font-hand);
		font-weight: var(--text-section-title--font-weight);
		font-size: calc(var(--text-section-title) * var(--k));
		line-height: calc(var(--text-section-title--line-height) * var(--k));
		color: var(--section-ink);
		overflow-wrap: anywhere;
	}
	.sn-page__stroke {
		width: calc(150px * var(--k));
		height: calc(8px * var(--k));
		color: var(--section-ink);
	}
	.sn-page__range {
		margin: 0;
		font-family: var(--font-hand);
		font-weight: var(--text-pencil-note--font-weight);
		font-size: calc(var(--text-pencil-note) * var(--k));
		line-height: calc(var(--text-pencil-note--line-height) * var(--k));
		color: var(--pencil);
	}
	.sn-page__free {
		position: absolute;
		top: calc(96px * var(--k));
		left: 0;
		right: 0;
		text-align: center;
		font-family: var(--font-hand);
		font-weight: var(--text-pencil-note--font-weight);
		font-size: calc(var(--text-pencil-note) * var(--k));
		line-height: calc(var(--text-pencil-note--line-height) * var(--k));
		color: var(--pencil);
		opacity: 0.45;
	}
	.sn-page__number {
		position: absolute;
		bottom: calc(14px * var(--k));
		right: calc(18px * var(--k));
		font-family: var(--font-ui);
		font-weight: var(--text-numeral--font-weight);
		font-size: calc(var(--text-numeral) * var(--k));
		line-height: calc(var(--text-numeral--line-height) * var(--k));
		font-variant-numeric: tabular-nums;
		color: var(--pencil);
	}
	.sn-page--left .sn-page__number {
		right: auto;
		left: calc(18px * var(--k));
	}
</style>
