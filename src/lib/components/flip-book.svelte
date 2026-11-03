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
		visibleLeaves,
		type Turn
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
	const strips = new MediaQuery('max-width: 559.98px', false);
	const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce', false);

	const width = $derived(wide.current ? 340 : 158);
	const height = $derived(width * 1.4);
	const zone = $derived(Math.max(44, width * 0.2));
	const last = $derived(spreadCount(pages.length) - 1);
	const leaves = $derived(leafCount(pages.length));

	let shown = $state(untrack(() => clampSpread(spread, pages.length)));
	let turn = $state<Turn | null>(null);
	let frame = 0;

	$effect(() => {
		const target = clampSpread(spread, pages.length);
		untrack(() => go(target));
		return () => cancelAnimationFrame(frame);
	});

	/** Turn to `target`: every turn, one page or a riffle, runs on the same spring. */
	function go(target: number) {
		if (turn?.to === target) return;
		if (turn) land();
		if (target === shown) return;
		if (reducedMotion.current) {
			shown = target;
			return;
		}
		let spring: SpringState = { x: 0, v: 0 };
		let before = performance.now();
		turn = { from: shown, to: target, progress: 0 };
		const tick = (now: number) => {
			spring = stepSpring(spring, 1, Math.min((now - before) / 1000, 1 / 30));
			before = now;
			if (!turn) return;
			if (atRest(spring, 1)) return land();
			turn = { ...turn, progress: spring.x };
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
	}

	function land() {
		cancelAnimationFrame(frame);
		if (turn) shown = turn.to;
		turn = null;
	}

	function turnBy(step: number) {
		spread = clampSpread((turn?.to ?? shown) + step, pages.length);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
		const target = event.target;
		if (
			target instanceof HTMLElement &&
			(target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
		) {
			return;
		}
		if (event.key === 'ArrowRight') turnBy(1);
		else if (event.key === 'ArrowLeft') turnBy(-1);
		else return;
		event.preventDefault();
	}

	/** Each Section's tab, in page order, so tabs fan down the edge. A tab belongs to its Title Page's leaf. */
	const tabs = $derived(
		pages.flatMap((page, index) =>
			page.section && page.title
				? [{ index, section: page.section, number: index + 1, order: 0 }]
				: []
		)
	);
	const tabOf = $derived(new Map(tabs.map((tab, order) => [tab.index, { ...tab, order }])));
	const tabHeight = $derived(strips.current ? 40 : 64);
	const tabStep = $derived(
		tabs.length > 1 ? Math.min(tabHeight + 8, (height - 24 - tabHeight) / (tabs.length - 1)) : 0
	);

	const flat = $derived(visibleLeaves(leaves, shown, turn));
	/** Leaves drawn: those in flight or on top of a stack, and the ones whose tab must stay reachable. */
	const drawn = $derived(
		Array.from({ length: leaves }, (_, j) => j).filter(
			(j) => flat.includes(j) || tabOf.has(2 * j) || tabOf.has(2 * j + 1)
		)
	);

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

<svelte:window {onkeydown} />

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
	{@const entry = tabOf.get(2 * leaf) ?? tabOf.get(2 * leaf + 1)}
	{#if entry}
		<span
			class="sn-flip__tab sn-flip__tab--{side}"
			style:top="{12 + entry.order * tabStep}px"
			style:--tab-height="{tabHeight}px"
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
	<div
		class="sn-flip"
		role="group"
		aria-roledescription="book"
		aria-label="Notebook"
		style:width="{width * 2}px"
		style:height="{height}px"
		style:perspective="{width * 5}px"
	>
		{#each drawn as j (j)}
			{@const t = leafTurn(j, shown, turn)}
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
			disabled={(turn?.to ?? shown) <= 0}
			onclick={() => turnBy(-1)}
		></button>
		<button
			type="button"
			class="sn-flip__zone sn-flip__zone--right"
			style:width="{zone}px"
			aria-label="Next pages"
			disabled={(turn?.to ?? shown) >= last}
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
	.sn-flip__tab--right {
		left: 100%;
	}
	.sn-flip__tab--left {
		right: 100%;
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
	.sn-flip__zone:disabled {
		pointer-events: none;
	}
	.sn-flip__zone:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: -2px;
	}
</style>
