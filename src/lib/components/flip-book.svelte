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
		inMotion,
		land,
		move,
		press,
		release,
		resting,
		retarget,
		type Gesture
	} from '$lib/flip-book/gesture';
	import { STRIPS, stripShade, stripTurns } from '$lib/flip-book/curl';
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
		/** The room the book and its tabs may take, in px. The book shrinks to fit; without it, it keeps its full size. */
		available?: number;
	}

	let { pages, spread = $bindable(0), available = Infinity }: Props = $props();

	/** The size depends on the screen, so the book is drawn once the page is on one, not from the server. */
	let mounted = $state(false);
	onMount(() => (mounted = true));

	const wide = new MediaQuery('min-width: 768px', true);
	const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce', false);

	/** How far a tab sticks out past the book: the width of a tab. */
	const tabReach = $derived(wide.current ? 24 : 14);
	const width = $derived(
		Math.max(96, Math.min(wide.current ? 340 : 158, Math.floor((available - 2 * tabReach) / 2)))
	);
	const height = $derived(width * 1.4);
	const zone = $derived(Math.max(44, width * 0.2));
	const last = $derived(spreadCount(pages.length) - 1);
	const leaves = $derived(leafCount(pages.length));

	/** The gesture's state: where the spring has the book, and the press on it, if any. */
	let g = $state.raw<Gesture>(resting(untrack(() => clampSpread(spread, pages.length))));
	let frame = 0;
	const flight = $derived({ pos: g.pos, anchor: g.anchor, speed: g.speed });
	const pos = $derived(g.pos);
	const dragging = $derived(g.press?.dragging ?? false);
	/** Which way the turning page's outer edge leads: +1 turning forward, -1 turning back. It eases when a turn reverses. */
	let lean = $state(1);

	$effect(() => {
		const clamped = clampSpread(spread, pages.length);
		if (clamped !== spread) spread = clamped;
		untrack(() => go(clamped));
	});
	$effect(() => () => cancelAnimationFrame(frame));

	function stopSpring() {
		cancelAnimationFrame(frame);
		frame = 0;
	}

	/**
	 * Turn to `to`. Every turn, one page or a riffle, runs on the same spring: a new target while it is
	 * moving just retargets it, keeping its position and velocity.
	 */
	function go(to: number) {
		if (!frame && g.pos === g.anchor) lean = to >= g.pos ? 1 : -1;
		g = retarget(g, to);
		if (g.press?.dragging) return;
		if (reducedMotion.current) {
			stopSpring();
			g = land(g);
		} else if (!frame && inMotion(g)) {
			let spring: SpringState = { x: g.pos, v: g.speed };
			let before = performance.now();
			const tick = (now: number) => {
				const dt = Math.min((now - before) / 1000, 1 / 30);
				spring = stepSpring(spring, g.target, dt);
				before = now;
				if (g.target !== spring.x) {
					lean += (Math.sign(g.target - spring.x) - lean) * Math.min(1, dt * 12);
				}
				if (atRest(spring, g.target)) {
					frame = 0;
					g = land(g);
					return;
				}
				g = { ...g, pos: spring.x, speed: spring.v };
				frame = requestAnimationFrame(tick);
			};
			frame = requestAnimationFrame(tick);
		}
	}

	/**
	 * A press on a page. Once the pointer has moved far enough it is a drag: the page follows the pointer,
	 * and on release the same spring takes it from where it was let go, with the pointer's velocity.
	 */
	let swallowClick = false;

	function onpointerdown(event: PointerEvent) {
		const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const held = g.press;
		g = press(g, {
			id: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			button: event.button,
			primary: event.isPrimary,
			fraction: (event.clientX - box.left) / box.width,
			lastSpread: last
		});
		if (g.press?.resume) stopSpring();
		else if (held?.resume && !g.press) go(g.target);
	}

	function onpointermove(event: PointerEvent) {
		const had = g.press;
		const was = had?.dragging;
		g = move(g, {
			id: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			buttonUp: event.pointerType === 'mouse' && event.buttons === 0,
			now: performance.now(),
			pageWidth: width,
			reducedMotion: reducedMotion.current
		});
		if (had && !g.press) go(g.target);
		if (g.press?.dragging && !was) {
			stopSpring();
			lean = g.press.dir;
			(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		}
	}

	function onpointerup(event: PointerEvent, cancelled = false) {
		const was = g.press;
		if (!was || event.pointerId !== was.id) return;
		g = release(g, {
			id: event.pointerId,
			cancelled,
			now: performance.now(),
			pageWidth: width,
			reducedMotion: reducedMotion.current
		});
		if (!was.dragging) {
			go(g.target);
			return;
		}
		swallowClick = true;
		setTimeout(() => (swallowClick = false), 100);
		spread = g.target;
		go(g.target);
	}

	/**
	 * Capturing the pointer on the book at drag start releases the pressed button's own implicit capture,
	 * which fires this event with the drag still live. While the pointer is down, hold on to it.
	 */
	function onlostpointercapture(event: PointerEvent) {
		if (g.press?.dragging && event.buttons !== 0 && event.pointerId === g.press.id) {
			(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		} else onpointerup(event, true);
	}

	function onclickcapture(event: MouseEvent) {
		if (!swallowClick) return;
		swallowClick = false;
		event.stopPropagation();
		event.preventDefault();
	}

	/** Holding a key turns on with the spring, never queueing turns ahead of it. */
	function turnBy(step: number, held = false) {
		if (held && Math.abs(g.target - pos) >= 1.5) return;
		spread = clampSpread(g.target + step, pages.length);
	}

	function onkeydown(event: KeyboardEvent) {
		if (dragging) return;
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

{#snippet cut(index: number, side: 'left' | 'right', offset: number, shade: string)}
	<!-- Each strip shows the whole page, its width fixed from the page's, slid so only the strip's part is in view. -->
	<div class="sn-flip__cut" style:left="{1 - offset}px">{@render paper(index, side)}</div>
	<span class="sn-flip__shade" style:background={shade}></span>
{/snippet}

{#snippet bend(j: number, turns: number[], i: number)}
	{@const strip = width / STRIPS}
	{@const here = turns[i]}
	{@const before = i === 0 ? 0 : turns[i - 1]}
	{@const after = turns[i + 1] ?? 2 * here - (turns[i - 1] ?? here)}
	{@const a = stripShade(here)}
	{@const b = stripShade(after)}
	<div
		class="sn-flip__bend"
		style:width="{strip}px"
		style:left={i === 0 ? 0 : '100%'}
		style:transform="rotateY({-(here - before) * 180}deg)"
	>
		<!-- A strip shows one face at a time: the front until it has turned past edge-on. -->
		{#if here < 0.5}
			<div class="sn-flip__slice">
				{@render cut(
					2 * j,
					'right',
					i * strip,
					`linear-gradient(90deg, rgba(40,26,10,${a.front}), rgba(40,26,10,${b.front}))`
				)}
			</div>
		{:else}
			<div class="sn-flip__slice sn-flip__slice--back">
				{@render cut(
					2 * j + 1,
					'left',
					width - (i + 1) * strip,
					`linear-gradient(90deg, rgba(40,26,10,${b.back}), rgba(40,26,10,${a.back}))`
				)}
			</div>
		{/if}
		{#if i === STRIPS - 1}
			{@render flyingTab(j, a)}
		{:else}
			{@render bend(j, turns, i + 1)}
		{/if}
	</div>
{/snippet}

{#snippet flyingTab(leaf: number, shade: { front: number; back: number })}
	{@const entry = tabOf(2 * leaf) ?? tabOf(2 * leaf + 1)}
	{#if entry}
		<span
			class="sn-flip__tab sn-flip__flying"
			style:top="{entry.top}px"
			style:--tab-height="{entry.height}px"
		>
			<span class="sn-flip__flying-face">
				<SectionTab colour={entry.section.colour} name={entry.section.name} side="right" />
				<span class="sn-flip__shade" style:opacity={shade.front}></span>
			</span>
			<span class="sn-flip__flying-face sn-flip__flying-face--back">
				<SectionTab colour={entry.section.colour} name={entry.section.name} side="left" />
				<span class="sn-flip__shade" style:opacity={shade.back}></span>
			</span>
		</span>
	{/if}
{/snippet}

{#if mounted}
	<!-- The book takes the arrow keys only while it has focus, so it never steals them from other widgets. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div
		class="sn-flip"
		class:sn-flip--strips={!wide.current}
		class:sn-flip--dragging={dragging}
		role="group"
		aria-roledescription="book"
		aria-label="Notebook: use the left and right arrow keys to turn the pages. Drag a page to turn it."
		tabindex="0"
		{onkeydown}
		{onpointerdown}
		{onpointermove}
		{onpointerup}
		onpointercancel={(event) => onpointerup(event, true)}
		{onlostpointercapture}
		{onclickcapture}
		style:width="{width * 2}px"
		style:height="{height}px"
		style:perspective="{width * 5}px"
	>
		{#each drawn as j (j)}
			{@const t = leafTurn(j, flight)}
			{@const full = flat.includes(j)}
			{@const shade = Math.sin(t * Math.PI) * 0.3}
			{#if t > 0 && t < 1}
				<!-- A page in the air is cut into strips so it can curl. Its copy for each strip is hidden from assistive tech. -->
				<div
					class="sn-flip__leaf"
					style:left="{width}px"
					style:width="{width}px"
					style:height="{height}px"
					style:z-index={leaves * 2 + 5}
					aria-hidden="true"
					inert
				>
					{@render bend(j, stripTurns(t, lean), 0)}
				</div>
			{:else}
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
			{/if}
		{/each}

		<button
			type="button"
			class="sn-flip__zone sn-flip__zone--left"
			style:width="{zone}px"
			aria-label="Previous pages"
			aria-disabled={g.target <= 0}
			onclick={() => turnBy(-1)}
		></button>
		<button
			type="button"
			class="sn-flip__zone sn-flip__zone--right"
			style:width="{zone}px"
			aria-label="Next pages"
			aria-disabled={g.target >= last}
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
		/* A horizontal drag turns the page; a vertical one still scrolls the screen. */
		touch-action: pan-y;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}
	.sn-flip--dragging {
		cursor: grabbing;
	}
	/* One strip of a page in the air, hinged on the one before it. Its width is the strip's; it shows a slice of a full-width page. */
	.sn-flip__bend {
		position: absolute;
		top: 0;
		bottom: 0;
		transform-origin: left center;
		transform-style: preserve-3d;
	}
	/* Slices run 1px past the strip on each side so no seam shows where strips meet. */
	.sn-flip__slice {
		position: absolute;
		top: 0;
		bottom: 0;
		left: -1px;
		right: -1px;
		overflow: hidden;
		backface-visibility: hidden;
	}
	.sn-flip__slice--back {
		transform: rotateY(180deg);
	}
	.sn-flip__cut {
		position: absolute;
		top: 0;
	}
	/* A tab riding a turning Title Page: two-sided, on the last strip's outer edge. */
	.sn-flip__flying {
		left: 100%;
		transform-style: preserve-3d;
	}
	.sn-flip__flying-face {
		display: block;
		position: relative;
		backface-visibility: hidden;
	}
	.sn-flip__flying-face--back {
		position: absolute;
		inset: 0;
		transform: rotateY(180deg);
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
