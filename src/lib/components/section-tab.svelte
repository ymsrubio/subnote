<script lang="ts">
	import type { SectionColour } from '$lib/design/sections';

	interface Props {
		colour: SectionColour;
		/** The Section's full name. Below 560px the label hides, so this is also the accessible name. */
		name: string;
		side?: 'left' | 'right';
		/** The Section open in the book: its tab sticks out 6px further. */
		current?: boolean;
		onclick?: () => void;
	}

	let { colour, name, side = 'right', current = false, onclick }: Props = $props();
</script>

<button
	type="button"
	class="sn-tab sn-sec--{colour}"
	class:sn-tab--left={side === 'left'}
	aria-label={name}
	aria-current={current ? 'true' : undefined}
	{onclick}
>
	<span class="sn-tab__label" aria-hidden="true">{name}</span>
</button>
