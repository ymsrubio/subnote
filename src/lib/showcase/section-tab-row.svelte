<script module lang="ts">
	export const title = 'Section tab and row';
	export const order = 160;
</script>

<script lang="ts">
	import X from '@lucide/svelte/icons/x';
	import SectionRow from '$lib/components/section-row.svelte';
	import SectionTab from '$lib/components/section-tab.svelte';
	import { Button } from '$lib/components/ui/button';
	import { sectionColours } from '$lib/design/sections';

	const names = {
		sage: 'Journal',
		clay: 'Habit tracker',
		ochre: 'Idea capture',
		slate: 'Calendar',
		plum: 'Reading log',
		teal: 'Recipes'
	};
</script>

<div class="grid gap-3">
	<p class="text-muted-foreground">
		The index tab sticking out of a Title Page, in each Section's tint and ink. The open Section's
		tab sticks out 6px further. Below 560px wide, tabs drop their labels and narrow to 14px strips;
		each keeps its Section name as its accessible name.
	</p>
	<div class="grid grid-cols-2 gap-12 px-8">
		{#each ['left', 'right'] as const as side (side)}
			<div class="relative min-h-150 rounded-md bg-paper p-4 text-foreground">
				<span class="type-caption text-muted-foreground">{side} edge</span>
				<div
					class="absolute top-12 flex flex-col gap-2 {side === 'left' ? 'right-full' : 'left-full'}"
				>
					{#each sectionColours as colour, index (colour)}
						<SectionTab {colour} name={names[colour]} {side} current={index === 1} />
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>

<div class="grid gap-3">
	<p class="text-muted-foreground">
		A Section's list, as slips of its paper lying on linen. The selected slip sticks out 8px further
		with a raised shadow. The rounding line shows only when rounding changed the size. Free Pages
		and a Pending Section are plain paper slips with no tab.
	</p>
	<div class="sn-linen rounded-lg">
		<ul class="sn-seclist" aria-label="Sections">
			<SectionRow
				kind="placed"
				colour="sage"
				name="Journal"
				first={1}
				last={64}
				asked={64}
				size={64}
			/>
			<SectionRow
				kind="placed"
				colour="clay"
				name="Habit tracker"
				first={65}
				last={96}
				asked={20}
				size={32}
				current
			/>
			<SectionRow
				kind="placed"
				colour="slate"
				name="Calendar"
				first={113}
				last={116}
				asked={3}
				size={4}
				mark="from Spring"
			>
				{#snippet action()}
					<Button
						variant="ghost"
						size="icon"
						class="text-slip-foreground hover:bg-black/10 hover:text-slip-foreground"
						aria-label="Remove Calendar"><X /></Button
					>
				{/snippet}
			</SectionRow>
			<SectionRow kind="free" first={117} last={120} />
			<SectionRow kind="pending" colour="plum" name="Reading log" mark="was Pending" />
		</ul>
	</div>
</div>

<div class="grid gap-3">
	<p class="text-muted-foreground">
		A Section's name on its own in the room (a card, a dialog or a sheet) sits on a small slip of
		its paper, so it reads in both themes.
	</p>
	<div class="flex flex-wrap gap-2 rounded-lg border bg-card p-5">
		{#each sectionColours as colour (colour)}
			<span class="sn-slip sn-sec--{colour}">{names[colour]}</span>
		{/each}
	</div>
</div>
