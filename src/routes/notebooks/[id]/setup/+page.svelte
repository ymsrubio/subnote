<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import CoverHeader from '$lib/components/cover-header.svelte';
	import PageGrid from '$lib/components/page-grid.svelte';
	import SectionRow from '$lib/components/section-row.svelte';
	import { Button } from '$lib/components/ui/button';
	import { freePages } from '$lib/placement';
	import { notebookStore, type SavedNotebook } from '$lib/storage';

	let saved = $state<SavedNotebook | 'missing'>();

	onMount(async () => {
		saved = (await notebookStore.get(page.params.id ?? '')) ?? 'missing';
	});

	const reason = 'Add a Section to confirm Setup.';
</script>

<svelte:head
	><title>{saved && saved !== 'missing' ? `Setup · ${saved.name}` : 'Setup'} · Subnote</title
	></svelte:head
>

{#if saved === 'missing'}
	<main class="mx-auto grid min-h-dvh max-w-md content-center justify-items-start gap-4 px-5">
		<h1 class="type-cover-title">That Notebook isn't on this device</h1>
		<p class="text-muted-foreground">
			Notebooks are saved on the device where you made them. Start a new one here, or open Subnote
			on the device that has it.
		</p>
		<Button class="h-11 md:h-9" href={resolve('/')}>Back to Subnote</Button>
	</main>
{:else if saved}
	{@const { name, notebook } = saved}
	{@const free = freePages(notebook)}

	{#snippet grid()}
		<PageGrid {name} pageCount={notebook.pageCount} sections={notebook.sections} />
	{/snippet}

	{#snippet note()}
		<p class="rounded-lg bg-card p-4 text-card-foreground shadow-(--shadow-slip)">
			Add each Section you plan to keep in this notebook. Subnote places them largest first, and you
			can remove any before you confirm.
		</p>
	{/snippet}

	{#snippet freeRow()}
		<ul class="sn-seclist">
			<SectionRow kind="free" first={1} last={notebook.pageCount} />
		</ul>
	{/snippet}

	<div class="sn-linen min-h-dvh md:hidden">
		<CoverHeader
			eyebrow="Setup"
			title={name}
			counts={[
				{ value: notebook.pageCount, label: 'pages' },
				{ value: notebook.sections.length, label: 'placed' },
				{ value: free, label: 'Free Pages' }
			]}
		>
			{@render grid()}
		</CoverHeader>
		<main class="grid gap-4 px-4 pt-4 pb-40">
			{@render note()}
			{@render freeRow()}
		</main>
		<footer
			class="sn-linen fixed inset-x-0 bottom-0 grid gap-2 border-t border-board px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
		>
			<p id="confirm-reason-phone" class="text-center type-caption text-cover-muted-foreground">
				{reason}
			</p>
			<Button variant="paper" class="h-11 w-full" disabled aria-describedby="confirm-reason-phone">
				Confirm Setup
			</Button>
		</footer>
	</div>

	<div class="hidden min-h-dvh md:grid md:grid-cols-[400px_minmax(0,1fr)]">
		<aside class="sn-linen grid content-start gap-4 p-6">
			<header class="grid gap-1">
				<h1 class="type-display">Setup</h1>
				<p class="type-caption text-cover-muted-foreground">{name} · {notebook.pageCount} pages</p>
			</header>
			{@render note()}
			{@render freeRow()}
		</aside>
		<section class="grid content-start gap-4 bg-desk p-8 pt-18" aria-labelledby="where-pages-go">
			<div class="grid gap-1">
				<h2 id="where-pages-go" class="type-title">Where every page goes</h2>
				<p class="text-desk-muted-foreground">
					Each square is a page, 16 to a row. Every page is a Free Page until you add a Section.
				</p>
			</div>
			{@render grid()}
			<div class="flex items-center justify-end gap-4">
				<p id="confirm-reason-desk" class="type-caption text-desk-muted-foreground">{reason}</p>
				<Button size="lg" disabled aria-describedby="confirm-reason-desk">Confirm Setup</Button>
			</div>
		</section>
	</div>
{/if}
