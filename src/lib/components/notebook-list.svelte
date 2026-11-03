<script lang="ts">
	import { resolve } from '$app/paths';
	import CoverHeader from '$lib/components/cover-header.svelte';
	import { Button } from '$lib/components/ui/button';
	import { notebookSummary, pageStrip, waitingSections } from '$lib/notebook-list';
	import type { SavedNotebook } from '$lib/storage';

	interface Props {
		/** Oldest first, as the store lists them. */
		notebooks: SavedNotebook[];
	}

	let { notebooks }: Props = $props();

	const newestFirst = $derived([...notebooks].reverse());
	const waiting = $derived(waitingSections(notebooks));
	const pending = $derived(waiting?.sections ?? []);
	const current = $derived(newestFirst.find((saved) => saved.setupConfirmed));
	const tabs = $derived(current?.notebook.sections.map((s) => s.colour) ?? []);

	const hrefFor = (saved: SavedNotebook) =>
		saved.setupConfirmed
			? resolve('/notebooks/[id]', { id: saved.id })
			: resolve('/notebooks/[id]/setup', { id: saved.id });

	const whenFor = (saved: SavedNotebook) =>
		!saved.setupConfirmed ? 'Needs Setup' : saved === current ? 'Current' : 'Earlier';
</script>

<div class="sn-linen min-h-dvh pb-8 md:bg-background md:bg-none md:text-foreground">
	<CoverHeader
		eyebrow="Saved on this device"
		title="Your Notebooks"
		counts={[
			{ value: notebooks.length, label: notebooks.length === 1 ? 'Notebook' : 'Notebooks' },
			{
				value: pending.length,
				label: pending.length === 1 ? 'Pending Section' : 'Pending Sections'
			}
		]}
		{tabs}
	>
		<div class="grid gap-6 md:grid-cols-[minmax(0,1fr)_340px] md:items-start">
			<section
				class="grid gap-3 rounded-lg border border-border bg-card p-5 text-card-foreground shadow-(--shadow-sheet) md:order-2 md:mt-7"
				aria-labelledby="waiting-heading"
			>
				<div class="grid gap-1">
					<h2 id="waiting-heading" class="text-xl/[26px] font-bold md:text-[17px]/[22px]">
						{#if waiting && pending.length > 0}
							<span class="md:hidden">Waiting for your next Notebook</span>
							<span class="hidden md:inline"
								>{pending.length} Pending {pending.length === 1 ? 'Section' : 'Sections'}</span
							>
						{:else}
							Nothing is waiting
						{/if}
					</h2>
					<p class="text-muted-foreground">
						{#if waiting && pending.length > 0}
							<span class="md:hidden">These didn't fit in {waiting.from}.</span>
							<span class="hidden md:inline"
								>They didn't fit in {waiting.from}. They'll be placed at your next Notebook's Setup.</span
							>
						{:else}
							Every Section you've planned has a place. Start the next Notebook when this one is
							full.
						{/if}
					</p>
				</div>
				{#if pending.length > 0}
					<ul class="flex flex-wrap gap-2" aria-label="Pending Sections">
						{#each pending as section (section.name)}
							<li class="sn-slip sn-sec--{section.colour}">{section.name}</li>
						{/each}
					</ul>
				{/if}
				<!-- #26 builds the screen this opens. Until then the one main button says so. -->
				<Button
					size="lg"
					class="h-11 md:h-10 md:justify-self-start"
					disabled
					aria-describedby="start-next-reason">Start next Notebook</Button
				>
				<p id="start-next-reason" class="type-caption text-muted-foreground">
					Starting the next Notebook isn't available yet.
				</p>
			</section>

			<section class="grid gap-2 md:order-1" aria-labelledby="notebooks-heading">
				<h2 id="notebooks-heading" class="px-1 text-cover-muted-foreground type-label">
					Notebooks
				</h2>
				<ul class="grid gap-4 md:grid-cols-2">
					{#each newestFirst as saved (saved.id)}
						<li class="grid">
							<a
								href={hrefFor(saved)}
								class="grid content-start gap-3 rounded-lg border border-transparent bg-card p-5 text-card-foreground shadow-(--shadow-slip) outline-none focus-visible:shadow-(--focus-ring) md:border-border md:p-6 md:shadow-(--shadow-sheet)"
							>
								<span class="flex items-baseline justify-between gap-2">
									<span class="text-xl/[26px] font-bold">{saved.name}</span>
									<span class="type-caption text-muted-foreground">{whenFor(saved)}</span>
								</span>
								<span class="flex h-5 gap-0.5" aria-hidden="true">
									{#each pageStrip(saved) as run, at (at)}
										<span
											class="min-w-0.5 rounded-xs {run.colour
												? `sn-sec--${run.colour} bg-(--section-tab) shadow-[inset_3px_0_0_var(--section-ink)]`
												: 'bg-paper shadow-[inset_0_0_0_1px_var(--input)]'}"
											style:flex="{run.pages} 1 0"
										></span>
									{/each}
								</span>
								{#if saved.notebook.sections.length > 0}
									<span class="sr-only md:hidden">
										Sections: {saved.notebook.sections.map((s) => s.name).join(', ')}.
									</span>
									<span class="hidden flex-wrap gap-2 md:flex">
										{#each saved.notebook.sections as section (section.name)}
											<span class="sn-slip sn-sec--{section.colour}">{section.name}</span>
										{/each}
									</span>
								{/if}
								<span class="type-caption text-muted-foreground">{notebookSummary(saved)}</span>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		</div>
	</CoverHeader>
</div>
