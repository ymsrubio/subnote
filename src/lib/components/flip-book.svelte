<script module lang="ts">
	import type { PageSection } from './page.svelte';

	/** One page of the book. Its number is its position: the first page is page 1. */
	export interface FlipBookPage {
		section?: PageSection;
		/** The Section's Title Page: it names the Section and carries the Section's tab. */
		title?: boolean;
		/** The Section's page range, written on its Title Page. */
		range?: string;
	}
</script>

<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import { onMount, untrack } from 'svelte';
	import Page from './page.svelte';
	import SectionTab from './section-tab.svelte';
	import { atRest, stepSpring, type SpringState } from '$lib/flip-book/spring';
	import {
		clampSpread,
		leafCount,
		leafTurn,
		spreadCount,
		spreadOfPage,
		visibleLeaves
	} from '$lib/flip-book/turn';

	interface Props {
		pages: FlipBookPage[];
		/** The spread showing: 0 is page 1 alone, then pages 2 and 3, and so on. Setting it turns to it. */
		spread?: number;
	}

	let { pages, spread = $bindable(0) }: Props = $props();

	/** The size depends on the screen, so the book is drawn once the page is on one, not from the server. */
	let mounted = $state(false);
	onMount(() => (mounted = true));

	const wide = new MediaQuery('min-width: 768px', true);
	const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce', false);

	const width = $derived(wide.current ? 340 : 158);
	const height = $derived(width * 1.4);
	const zone = $derived(Math.max(44, width * 0.2));
	const last = $derived(spreadCount(pages.length) - 1);
	const leaves = $derived(leafCount(pages.length));

	/** The spring's state. `anchor` is the spread the book last rested on. */
	const start = untrack(() => clampSpread(spread, pages.length));
	let pos = $state(start);
	let anchor = $state(start);
	let speed = $state(0);
	let target = $state(start);
	let frame = 0;
	const flight = $derived({ pos, anchor, speed });

	$effect(() => {
		const clamped = clampSpread(spread, pages.length);
		if (clamped !== spread) spread = clamped;
		untrack(() => go(clamped));
	});
	$effect(() => () => cancelAnimationFrame(frame));

	/**
	 * Turn to `to`. Every turn, one page or a riffle, runs on the same spring: a new target while it is
	 * moving just retargets it, keeping its position and velocity.
	 */
	function go(to: number) {
		target = to;
		if (reducedMotion.current) {
			cancelAnimationFrame(frame);
			frame = 0;
			land();
		} else if (!frame && (to !== pos || speed !== 0)) {
			let spring: SpringState = { x: pos, v: speed };
			let before = performance.now();
			const tick = (now: number) => {
				spring = stepSpring(spring, target, Math.min((now - before) / 1000, 1 / 30));
				before = now;
				if (atRest(spring, target)) {
					frame = 0;
					land();
					return;
				}
				pos = spring.x;
				speed = spring.v;
				frame = requestAnimationFrame(tick);
			};
			frame = requestAnimationFrame(tick);
		}
	}

	function land() {
		pos = anchor = target;
		speed = 0;
	}

	/** Holding a key turns on with the spring, never queueing turns ahead of it. */
	function turnBy(step: number, held = false) {
		if (held && Math.abs(target - pos) >= 1.5) return;
		spread = clampSpread(target + step, pages.length);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
		if (event.key === 'ArrowRight') turnBy(1, event.repeat);
		else if (event.key === 'ArrowLeft') turnBy(-1, event.repeat);
		else return;
		event.preventDefault();
	}

	/** Each Section's tab, in page order, on the leaf that carries its Title Page. */
	const tabs = $derived(
		pages.flatMap((page, index) =>
			page.section && page.title ? [{ index, section: page.section, number: index + 1 }] : []
		)
	);
	/**
	 * Tabs fan down the page's edge without overlapping. A name needs about 5.8px a letter; if they do not
	 * all fit, each shrinks to share the edge. Strips have no names, so they just share it.
	 */
	const tabLayout = $derived.by(() => {
		const room = height - 24;
		const natural = tabs.map((tab) =>
			!wide.current ? 40 : Math.max(64, Math.ceil(tab.section.name.length * 5.8 + 16))
		);
		const total = natural.reduce((sum, h) => sum + h, 0);
		const squeeze = Math.min(1, room / Math.max(total, 1));
		const heights = natural.map((h) => Math.floor(h * squeeze));
		const gap =
			tabs.length > 1
				? Math.min(8, (room - heights.reduce((a, h) => a + h, 0)) / (tabs.length - 1))
				: 0;
		let top = 12;
		return tabs.map((tab, i) => {
			const placed = { ...tab, top, height: heights[i] };
			top += heights[i] + gap;
			return placed;
		});
	});
	const tabOf = (index: number) => tabLayout.find((tab) => tab.index === index);

	const flat = $derived(visibleLeaves(leaves, flight));
	/** Leaves drawn: those in flight or on top of a stack, and the ones whose tab must stay reachable. */
	const drawn = $derived(
		Array.from({ length: leaves }, (_, j) => j).filter(
			(j) => flat.includes(j) || tabOf(2 * j) || tabOf(2 * j + 1)
		)
	);

	const shown = $derived(Math.round(pos));
	const current = $derived(
		new Set([pages[2 * shown - 1]?.section?.name, pages[2 * shown]?.section?.name])
	);
	const label = $derived(
		shown === 0
			? 'Page 1'
			: pages[2 * shown]
				? `Pages ${2 * shown} and ${2 * shown + 1}`
				: `Page ${2 * shown}`
	);
</script>

{#snippet paper(index: number, side: 'left' | 'right')}
	{@const page = pages[index]}
	{#if page?.section && page.title}
		<Page number={index + 1} {side} {width} section={page.section} title range={page.range} />
	{:else if page?.section}
		<Page number={index + 1} {side} {width} section={page.section} />
	{:else if page}
		<Page number={index + 1} {side} {width} />
	{/if}
{/snippet}

{#snippet tab(leaf: number, side: 'left' | 'right')}
	{@const entry = tabOf(2 * leaf) ?? tabOf(2 * leaf + 1)}
	{#if entry}
		<span
			class="sn-flip__tab sn-flip__tab--{side}"
			style:top="{entry.top}px"
			style:--tab-height="{entry.height}px"
		>
			<SectionTab
				colour={entry.section.colour}
				name={entry.section.name}
				{side}
				current={current.has(entry.section.name)}
				onclick={() => (spread = spreadOfPage(entry.number))}
			/>
		</span>
	{/if}
{/snippet}

{#if mounted}
	<!-- The book takes the arrow keys only while it has focus, so it never steals them from other widgets. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		class="sn-flip"
		class:sn-flip--strips={!wide.current}
		role="group"
		aria-roledescription="book"
		aria-label="Notebook: use the left and right arrow keys to turn the pages"
		tabindex="0"
		{onkeydown}
		style:width="{width * 2}px"
		style:height="{height}px"
		style:perspective="{width * 5}px"
	>
		{#each drawn as j (j)}
			{@const t = leafTurn(j, flight)}
			{@const full = flat.includes(j)}
			{@const shade = Math.sin(t * Math.PI) * 0.3}
			<div
				class="sn-flip__leaf"
				style:left="{width}px"
				style:width="{width}px"
				style:height="{height}px"
				style:transform="rotateY({-t * 180}deg)"
				style:z-index={t === 1 ? j + 1 : t === 0 ? leaves - j + 1 : leaves * 2 + 5}
			>
				<div class="sn-flip__face" inert={t >= 0.5}>
					{#if full}{@render paper(2 * j, 'right')}{/if}
					<span class="sn-flip__shade" style:opacity={shade}></span>
					{@render tab(j, 'right')}
				</div>
				<div class="sn-flip__face sn-flip__face--back" inert={t < 0.5}>
					{#if full}{@render paper(2 * j + 1, 'left')}{/if}
					<span class="sn-flip__shade" style:opacity={shade}></span>
					{@render tab(j, 'left')}
				</div>
			</div>
		{/each}

		<button
			type="button"
			class="sn-flip__zone sn-flip__zone--left"
			style:width="{zone}px"
			aria-label="Previous pages"
			aria-disabled={target <= 0}
			onclick={() => turnBy(-1)}
		></button>
		<button
			type="button"
			class="sn-flip__zone sn-flip__zone--right"
			style:width="{zone}px"
			aria-label="Next pages"
			aria-disabled={target >= last}
			onclick={() => turnBy(1)}
		></button>
	</div>
{/if}
<p class="sr-only" aria-live="polite">{label}</p>

<style>
	.sn-flip {
		position: relative;
		isolation: isolate;
		margin-inline: auto;
		flex: none;
	}
	.sn-flip__leaf {
		position: absolute;
		top: 0;
		transform-origin: left center;
		transform-style: preserve-3d;
	}
	.sn-flip__face {
		position: absolute;
		inset: 0;
		backface-visibility: hidden;
	}
	/* The back is drawn flipped; the leaf's own turn flips it back to read the right way round. */
	.sn-flip__face--back {
		transform: rotateY(180deg);
	}
	.sn-flip__shade {
		position: absolute;
		inset: 0;
		background: #281a0a;
		pointer-events: none;
	}
	.sn-flip__tab {
		position: absolute;
	}
	.sn-flip__tab :global(.sn-tab) {
		height: var(--tab-height);
		min-height: 0;
		overflow: hidden;
	}
	/* Where the pages are 158px wide the names would not fit, so every width up to 768px gets strips. */
	.sn-flip--strips .sn-flip__tab :global(.sn-tab) {
		width: 14px;
		padding: 0;
	}
	.sn-flip--strips .sn-flip__tab :global(.sn-tab__label) {
		display: none;
	}
	.sn-flip__tab--right {
		left: 100%;
	}
	.sn-flip__tab--left {
		right: 100%;
	}
	.sn-flip:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 8px;
	}
	.sn-flip__zone {
		position: absolute;
		top: 0;
		bottom: 0;
		z-index: 1000;
		border: 0;
		padding: 0;
		background: transparent;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}
	.sn-flip__zone--left {
		left: 0;
	}
	.sn-flip__zone--right {
		right: 0;
	}
	.sn-flip__zone[aria-disabled='true'] {
		pointer-events: none;
	}
	.sn-flip__zone:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}
</style>
