<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import X from '@lucide/svelte/icons/x';
	import { onMount, tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import FlipBook from '$lib/components/flip-book.svelte';
	import CoverHeader from '$lib/components/cover-header.svelte';
	import NotebookAddSectionSheet from '$lib/components/notebook-add-section-sheet.svelte';
	import NotebookMissing from '$lib/components/notebook-missing.svelte';
	import RemoveSectionDialog from '$lib/components/remove-section-dialog.svelte';
	import SectionRow from '$lib/components/section-row.svelte';
	import StorageBlocked from '$lib/components/storage-blocked.svelte';
	import { Button } from '$lib/components/ui/button';
	import { bookPages, spreadOfSection } from '$lib/notebook/book-pages';
	import { saveAddSection } from '$lib/notebook/add-section';
	import {
		noticeOf,
		removedNoticeOf,
		rowMeta,
		rowsInPageOrder,
		summaryLine
	} from '$lib/notebook/notebook-text';
	import { saveRemoveSection } from '$lib/notebook/remove-section';
	import {
		freePages,
		type PlacedSection,
		type PlacementOutcome,
		type SectionRequest
	} from '$lib/placement';
	import { notebookStore, type SavedNotebook } from '$lib/storage';

	type Removing = Pick<PlacedSection, 'name' | 'colour' | 'first' | 'last' | 'size'>;
	let saved = $state<SavedNotebook | 'missing' | 'blocked'>();
	let sheetOpen = $state(false);
	let notice = $state<{ name: string; colour: PlacedSection['colour']; text: string } | null>(null);
	let removeOpen = $state(false);
	let removing = $state<Removing | null>(null);
	let addButtonEl = $state<HTMLElement | null>(null);
	let removedJustNow = false;
	let spread = $state(0);
	/** The width of the desk or board the book sits on, so the book can shrink to fit it. */
	let deskWidth = $state(Infinity);

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

	function chooseRemove(section: Removing) {
		removing = section;
		removedJustNow = false;
		removeOpen = true;
	}

	/** Removes the chosen Section. Resolves to a message for the Dialog, or undefined once it closes. */
	async function removeChosen(): Promise<string | undefined> {
		const section = removing;
		if (!section) return undefined;
		try {
			const result = await saveRemoveSection(notebookStore, notebookId(), section);
			switch (result.status) {
				case 'saved':
					saved = result.saved;
					notice = removedNoticeOf(result.removed, result.recoloured);
					removedJustNow = true;
					removeOpen = false;
					return undefined;
				case 'gone':
					saved = result.saved;
					notice = {
						name: section.name,
						colour: section.colour,
						text: 'was already removed in another tab.'
					};
					removeOpen = false;
					return undefined;
				case 'changed':
					saved = result.saved;
					notice = {
						name: section.name,
						colour: section.colour,
						text: 'changed in another tab, so nothing was removed. Check the list, then try again.'
					};
					removeOpen = false;
					return undefined;
				case 'unconfirmed':
					removeOpen = false;
					await goto(resolve('/notebooks/[id]/setup', { id: notebookId() }), {
						replaceState: true
					});
					return undefined;
				case 'missing':
					removeOpen = false;
					saved = 'missing';
					return undefined;
			}
		} catch {
			return 'Subnote could not save this on your device. Check that storage is allowed.';
		}
	}

	/** After a removal the row is gone, so focus goes to Add Section instead of the top of the page. */
	function afterRemoveDialog(event: Event) {
		if (!removedJustNow) return;
		event.preventDefault();
		tick().then(() => addButtonEl?.focus());
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
		<div
			class={notice
				? 'grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 rounded-lg bg-card py-3 pr-2 pl-4 text-card-foreground shadow-(--shadow-slip)'
				: '-mt-4'}
		>
			<div role="status">
				{#if notice}
					<p>
						<span class="sn-slip sn-sec--{notice.colour}">{notice.name}</span>
						{notice.text}
					</p>
				{/if}
			</div>
			{#if notice}
				<Button
					variant="ghost"
					size="icon"
					class="-mt-1.5 max-md:size-11"
					aria-label="Dismiss"
					onclick={() => (notice = null)}><X /></Button
				>
			{/if}
		</div>
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
							meta={rowMeta(row)}
							onopen={() => (spread = spreadOfSection(row))}
						>
							{#snippet action()}
								<Button
									variant="ghost"
									size="icon"
									class="text-slip-foreground hover:bg-black/10 hover:text-slip-foreground max-md:size-11"
									aria-label="Options for {row.name}"
									aria-haspopup="dialog"
									onclick={() => chooseRemove(row)}><Ellipsis /></Button
								>
							{/snippet}
						</SectionRow>
					{:else}
						<SectionRow kind="free" first={row.first} last={row.last} meta={rowMeta(row)} />
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
							meta={rowMeta({ kind: 'pending', ...pending })}
						/>
					{/each}
				</ul>
				<p class="px-1 type-caption text-cover-muted-foreground md:hidden">
					Pending Sections wait for your next Notebook's Setup.
				</p>
			</section>
		{/if}
	{/snippet}

	{#snippet addButton()}
		<Button
			bind:ref={addButtonEl}
			variant="paper"
			class="h-11 justify-self-start md:h-9"
			onclick={() => (sheetOpen = true)}>Add Section</Button
		>
	{/snippet}

	{#snippet book(roomAround: number)}
		<FlipBook pages={bookPages(notebook)} bind:spread available={deskWidth - roomAround} />
	{/snippet}

	{#if desk.current}
		<main class="grid min-h-dvh grid-cols-[clamp(300px,34vw,400px)_minmax(0,1fr)]">
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
			<div
				class="grid place-items-center overflow-hidden bg-desk px-6 py-10"
				bind:clientWidth={deskWidth}
			>
				<div class="w-fit shadow-(--shadow-book)">{@render book(48)}</div>
			</div>
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
				<div
					class="-mx-4 grid place-items-center overflow-hidden bg-board px-4 py-8"
					bind:clientWidth={deskWidth}
				>
					<div class="w-fit shadow-(--shadow-book-on-cover)">{@render book(32)}</div>
				</div>
				{@render noticeCard()}
				{@render lists()}
				{@render addButton()}
			</main>
		</div>
	{/if}

	<NotebookAddSectionSheet bind:open={sheetOpen} saved={current} onadd={addSection} />
	<RemoveSectionDialog
		bind:open={removeOpen}
		section={removing}
		onremove={removeChosen}
		onCloseAutoFocus={afterRemoveDialog}
	/>
{/if}
