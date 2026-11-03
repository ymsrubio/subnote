<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import X from '@lucide/svelte/icons/x';
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import CoverHeader from '$lib/components/cover-header.svelte';
	import NotebookAddSectionSheet from '$lib/components/notebook-add-section-sheet.svelte';
	import NotebookMissing from '$lib/components/notebook-missing.svelte';
	import SectionRow from '$lib/components/section-row.svelte';
	import StorageBlocked from '$lib/components/storage-blocked.svelte';
	import { Button } from '$lib/components/ui/button';
	import { saveAddSection } from '$lib/notebook/add-section';
	import { noticeOf, rowsInPageOrder, summaryLine } from '$lib/notebook/notebook-text';
	import { freePages, type PlacementOutcome, type SectionRequest } from '$lib/placement';
	import { notebookStore, type SavedNotebook } from '$lib/storage';

	let saved = $state<SavedNotebook | 'missing' | 'blocked'>();
	let sheetOpen = $state(false);
	let notice = $state<ReturnType<typeof noticeOf>>(null);

	const desk = new MediaQuery('min-width: 768px');
	const notebookId = () => page.params.id ?? '';

	onMount(async () => {
		const id = notebookId();
		try {
			const found = await notebookStore.get(id);
			if (found && !found.setupConfirmed) {
				await goto(resolve('/notebooks/[id]/setup', { id }), { replaceState: true });
				return;
			}
			saved = found ?? 'missing';
		} catch {
			saved = 'blocked';
		}
	});

	/** Adds a Section. Resolves to a message for the form, or undefined once it is added. */
	async function addSection(
		request: SectionRequest,
		shown: PlacementOutcome
	): Promise<string | undefined> {
		try {
			const result = await saveAddSection(notebookStore, notebookId(), request, shown);
			switch (result.status) {
				case 'saved':
					saved = result.saved;
					notice = noticeOf(result.outcome);
					sheetOpen = false;
					return undefined;
				case 'changed':
					saved = result.saved;
					return 'This Notebook changed in another tab, so the preview above is updated. Check it, then add again.';
				case 'invalid':
					saved = result.saved;
					return result.message;
				case 'unconfirmed':
					sheetOpen = false;
					await goto(resolve('/notebooks/[id]/setup', { id: notebookId() }), {
						replaceState: true
					});
					return undefined;
				case 'missing':
					sheetOpen = false;
					saved = 'missing';
					return undefined;
			}
		} catch {
			return 'Subnote could not save this on your device. Check that storage is allowed.';
		}
	}
</script>

<svelte:head
	><title
		>{saved && saved !== 'missing' && saved !== 'blocked' ? saved.name : 'Notebook'} · Subnote</title
	></svelte:head
>

{#if saved === 'blocked'}
	<StorageBlocked />
{:else if saved === 'missing'}
	<NotebookMissing />
{:else if saved}
	{@const current = saved}
	{@const { name, notebook } = current}
	{@const free = freePages(notebook)}

	{#snippet back()}
		<Button
			variant="ghost"
			class="-ml-2 justify-self-start text-cover-foreground hover:bg-white/10 hover:text-cover-foreground max-md:h-11"
			href={resolve('/')}><ChevronLeft />Your Notebooks</Button
		>
	{/snippet}

	{#snippet noticeCard()}
		{#if notice}
			<div
				class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded-lg bg-card py-3 pr-2 pl-4 text-card-foreground shadow-(--shadow-slip)"
				role="status"
			>
				<p>
					<span class="sn-slip sn-sec--{notice.colour}">{notice.name}</span>
					{notice.text}
				</p>
				<Button
					variant="ghost"
					size="icon"
					class="-mt-1.5 max-md:size-11"
					aria-label="Dismiss"
					onclick={() => (notice = null)}><X /></Button
				>
			</div>
		{/if}
	{/snippet}

	{#snippet lists()}
		<section class="grid gap-2" aria-labelledby="sections-heading">
			<h2 id="sections-heading" class="px-1 text-cover-muted-foreground type-label">Sections</h2>
			<ul class="sn-seclist -mx-3" aria-label="Sections">
				{#each rowsInPageOrder(notebook) as row (row.first)}
					{#if row.kind === 'placed'}
						<SectionRow
							kind="placed"
							colour={row.colour}
							name={row.name}
							first={row.first}
							last={row.last}
							asked={row.requested}
							size={row.size}
						/>
					{:else}
						<SectionRow kind="free" first={row.first} last={row.last} />
					{/if}
				{/each}
			</ul>
		</section>
		{#if notebook.pending.length > 0}
			<section class="grid gap-2" aria-labelledby="pending-heading">
				<h2 id="pending-heading" class="px-1 text-cover-muted-foreground type-label">
					Pending Sections
				</h2>
				<ul class="sn-seclist -mx-3" aria-label="Pending Sections">
					{#each notebook.pending as pending (pending.name)}
						<SectionRow
							kind="pending"
							colour={pending.colour}
							name={pending.name}
							asked={pending.requested}
							size={pending.size}
						/>
					{/each}
				</ul>
				<p class="px-1 type-caption text-cover-muted-foreground">
					Pending Sections wait for your next Notebook's Setup.
				</p>
			</section>
		{/if}
	{/snippet}

	{#snippet addButton()}
		<Button
			variant="paper"
			class="h-11 justify-self-start md:h-9"
			onclick={() => (sheetOpen = true)}>Add Section</Button
		>
	{/snippet}

	{#if desk.current}
		<main class="grid min-h-dvh grid-cols-[400px_minmax(0,1fr)]">
			<div class="sn-linen grid content-start gap-4 p-6">
				{@render back()}
				<header class="grid gap-1">
					<h1 class="type-display">{name}</h1>
					<p class="type-caption text-cover-muted-foreground">{summaryLine(notebook)}</p>
				</header>
				{@render noticeCard()}
				{@render lists()}
				{@render addButton()}
			</div>
			<div class="bg-desk" aria-hidden="true"></div>
		</main>
	{:else}
		<div class="sn-linen min-h-dvh">
			<div class="px-3 pt-2">{@render back()}</div>
			<CoverHeader
				title={name}
				counts={[
					{ value: notebook.pageCount, label: 'pages' },
					{ value: notebook.sections.length, label: 'Sections' },
					{ value: free, label: 'Free Pages' }
				]}
				tabs={notebook.sections.map((s) => s.colour)}
			/>
			<main class="grid gap-4 px-4 pb-10">
				{@render noticeCard()}
				{@render lists()}
				{@render addButton()}
			</main>
		</div>
	{/if}

	<NotebookAddSectionSheet bind:open={sheetOpen} saved={current} onadd={addSection} />
{/if}
