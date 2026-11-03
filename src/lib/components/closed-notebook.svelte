<script lang="ts">
	import type { SectionColour } from '$lib/design/sections';

	interface Props {
		tabs?: SectionColour[];
	}

	let { tabs = ['sage', 'clay', 'ochre', 'slate'] }: Props = $props();
</script>

<div
	class="closed-notebook"
	role="img"
	aria-label="A closed paper notebook with an elastic band and Section tabs peeking from its pages"
>
	<span class="pages"></span>
	<span class="tabs">
		{#each tabs as colour (colour)}
			<span class="sn-sec--{colour}"></span>
		{/each}
	</span>
	<span class="cover sn-linen"></span>
	<span class="spine"></span>
	<span class="label"></span>
	<span class="elastic"></span>
</div>

<style>
	.closed-notebook {
		--size: var(--bw, 216px);
		position: relative;
		width: var(--size);
		height: calc(var(--size) * 1.38);
		margin-right: 24px;
	}
	.closed-notebook > span {
		position: absolute;
		display: block;
	}
	.pages {
		top: 5px;
		bottom: -6px;
		left: 6px;
		right: -8px;
		border-radius: 2px var(--radius-page) var(--radius-page) 2px;
		background-color: var(--paper);
		box-shadow: var(--shadow-book);
		background-image: repeating-linear-gradient(
			90deg,
			transparent 0 2px,
			var(--paper-edge) 2px 3px
		);
	}
	.tabs {
		top: calc(var(--size) * 0.18);
		right: calc(var(--size) * -0.11);
		display: grid;
		gap: calc(var(--size) * 0.035);
	}
	.tabs span {
		display: block;
		width: calc(var(--size) * 0.11);
		height: calc(var(--size) * 0.2);
		border-radius: 0 var(--radius-tab) var(--radius-tab) 0;
		background: var(--section-tab);
		box-shadow:
			var(--shadow-tab),
			inset -4px 0 0 var(--section-ink);
	}
	.cover {
		inset: 0;
		border-radius: var(--radius-page) 9px 9px var(--radius-page);
		box-shadow: var(--shadow-tab);
	}
	.spine {
		top: 0;
		bottom: 0;
		left: 0;
		width: calc(var(--size) * 0.07);
		border-radius: var(--radius-page) 0 0 var(--radius-page);
		background: rgba(0, 0, 0, 0.22);
		box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.06);
	}
	.label {
		top: calc(var(--size) * 0.34);
		left: calc(var(--size) * 0.22);
		width: calc(var(--size) * 0.5);
		height: calc(var(--size) * 0.27);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-tab);
		background:
			linear-gradient(var(--dot), var(--dot)) center 42% / 72% 1px no-repeat,
			linear-gradient(var(--dot), var(--dot)) center 70% / 72% 1px no-repeat,
			var(--paper);
	}
	.elastic {
		top: -3px;
		bottom: -9px;
		right: calc(var(--size) * 0.13);
		width: calc(var(--size) * 0.055);
		border-radius: 2px;
		background: var(--elastic);
		box-shadow: inset 2px 0 0 rgba(255, 255, 255, 0.07);
	}
</style>
