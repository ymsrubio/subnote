<script module lang="ts">
	export type SectionRowKind =
		| {
				kind: 'placed';
				colour: SectionColour;
				name: string;
				first: number;
				last: number;
				/** The Section open in the book. */
				current?: boolean;
		  }
		| { kind: 'free'; first: number; last: number }
		| { kind: 'pending'; colour: SectionColour; name: string };
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { SectionColour } from '$lib/design/sections';

	type Props = SectionRowKind & {
		/** Pages the person asked for. The rounding line shows only when `size` differs. */
		asked?: number;
		/** Pages the Section was rounded to. */
		size?: number;
		/** Replaces the default note under the name. */
		meta?: string;
		/** A short note after the name: "from Spring", "was Pending". */
		mark?: string;
		/** A ghost icon button on the right. Give it `text-slip-foreground`: a slip stays paper at night, so the button's own text colour would vanish. */
		action?: Snippet;
		/** Makes the whole row a button, named by the Section, that turns the book to it. The `action` stays its own button. */
		onopen?: () => void;
	};

	let { asked, size, meta, mark, action, onopen, ...row }: Props = $props();

	const rounded = $derived(asked !== undefined && size !== undefined && asked !== size);
	const label = $derived(row.kind === 'free' ? 'Free Pages' : row.name);
</script>

<li
	class="sn-secrow {row.kind === 'free' ? 'sn-secrow--free' : ''} {row.kind === 'pending'
		? 'sn-secrow--pending'
		: ''} {row.kind !== 'free' ? `sn-sec--${row.colour}` : ''}"
	aria-current={row.kind === 'placed' && row.current ? 'true' : undefined}
>
	<div class="sn-secrow__body">
		<p class="sn-secrow__name">
			{#if onopen}
				<button type="button" class="sn-secrow__open" onclick={onopen}>{label}</button>
			{:else}
				{label}
			{/if}
			{#if mark}<span class="sn-secrow__mark">{mark}</span>{/if}
		</p>
		{#if meta}
			<p class="sn-secrow__meta">{meta}</p>
		{:else if row.kind === 'pending'}
			<p class="sn-secrow__meta">Waits for the next Notebook</p>
		{:else if rounded}
			<p class="sn-secrow__meta">asked for {asked} · rounded to {size}</p>
		{/if}
	</div>
	{#if row.kind === 'pending'}
		<span class="sn-secrow__badge">Pending</span>
	{:else}
		<span class="sn-secrow__range">
			{row.first === row.last ? `page ${row.first}` : `pages ${row.first}–${row.last}`}
		</span>
	{/if}
	{#if action}<span class="sn-secrow__action">{@render action()}</span>{/if}
</li>
