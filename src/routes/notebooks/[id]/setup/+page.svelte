<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import X from '@lucide/svelte/icons/x';
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import AddSectionForm from '$lib/components/add-section-form.svelte';
	import CoverHeader from '$lib/components/cover-header.svelte';
	import NotebookMissing from '$lib/components/notebook-missing.svelte';
	import PageGrid from '$lib/components/page-grid.svelte';
	import SectionRow from '$lib/components/section-row.svelte';
	import StorageBlocked from '$lib/components/storage-blocked.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Sheet from '$lib/components/ui/sheet';
	import { freePages, setupNotebook, type SectionRequest } from '$lib/placement';
	import {
		confirmBlockedReason,
		freeRanges,
		placedLargestFirst,
		requestsOf,
		titlePages
	} from '$lib/setup/setup-sections';
	import { notebookStore, type SavedNotebook } from '$lib/storage';

	let saved = $state<SavedNotebook | 'missing' | 'blocked'>();
	let failure = $state('');
	let sheetOpen = $state(false);
	let confirmOpen = $state(false);
	let confirming = $state(false);

	const desk = new MediaQuery('min-width: 768px');

	onMount(async () => {
		const id = page.params.id ?? '';
		try {
			const found = await notebookStore.get(id);
			if (found?.setupConfirmed) {
				await goto(resolve('/notebooks/[id]', { id }), { replaceState: true });
				return;
			}
			saved = found ?? 'missing';
		} catch {
			saved = 'blocked';
		}
	});

	async function keep(next: SavedNotebook) {
		failure = '';
		try {
			await notebookStore.save(next);
			saved = next;
			return true;
		} catch {
			failure = 'Subnote could not save this on your device. Check that storage is allowed.';
			return false;
		}
	}

	async function replaceRequests(current: SavedNotebook, requests: SectionRequest[]) {
		const notebook = setupNotebook(current.notebook.pageCount, requests);
		return keep({ ...current, notebook });
	}

	async function addSection(current: SavedNotebook, request: SectionRequest) {
		const kept = await replaceRequests(current, [...requestsOf(current.notebook), request]);
		if (kept) sheetOpen = false;
	}

	async function removeSection(current: SavedNotebook, name: string) {
		await replaceRequests(
			current,
			requestsOf(current.notebook).filter((request) => request.name !== name)
		);
	}

	async function confirmSetup(current: SavedNotebook) {
		confirming = true;
		try {
			if (!(await keep({ ...current, setupConfirmed: true }))) return;
			confirmOpen = false;
			await goto(resolve('/notebooks/[id]', { id: current.id }), { replaceState: true });
		} finally {
			confirming = false;
		}
	}
</script>

<svelte:head
	><title
		>{saved && saved !== 'missing' && saved !== 'blocked' ? `Setup · ${saved.name}` : 'Setup'} · Subnote</title
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
	{@const reason = confirmBlockedReason(notebook)}
	{@const taken = [...notebook.sections, ...notebook.pending].map((s) => s.name)}

	{#snippet removeButton(sectionName: string)}
		<Button
			variant="ghost"
			size="icon"
			class="text-slip-foreground hover:bg-black/10 hover:text-slip-foreground max-md:size-11"
			aria-label="Remove {sectionName}"
			onclick={() => removeSection(current, sectionName)}><X /></Button
		>
	{/snippet}

	{#snippet grid()}
		<PageGrid {name} pageCount={notebook.pageCount} sections={notebook.sections} />
	{/snippet}

	{#snippet note()}
		{#if notebook.sections.length === 0 && notebook.pending.length === 0}
			<p class="rounded-lg bg-card p-4 text-card-foreground shadow-(--shadow-slip)">
				Add each Section you plan to keep in this notebook. Subnote places them largest first, and
				you can remove any before you confirm.
			</p>
		{/if}
	{/snippet}

	{#snippet lists()}
		<section class="grid gap-2" aria-labelledby="placed-heading">
			<h2 id="placed-heading" class="px-1 text-cover-muted-foreground type-label">
				Placed, largest first
			</h2>
			<ul class="sn-seclist -mx-3" aria-label="Placed Sections">
				{#each placedLargestFirst(notebook) as section (section.name)}
					<SectionRow
						kind="placed"
						colour={section.colour}
						name={section.name}
						first={section.first}
						last={section.last}
						asked={section.requested}
						size={section.size}
					>
						{#snippet action()}{@render removeButton(section.name)}{/snippet}
					</SectionRow>
				{/each}
				{#each freeRanges(notebook) as range (range.first)}
					<SectionRow kind="free" first={range.first} last={range.last} />
				{/each}
			</ul>
			{#if notebook.sections.length === 0}
				<p class="px-1 type-caption text-cover-muted-foreground">
					No Sections yet. Each one you add is placed here.
				</p>
			{/if}
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
						>
							{#snippet action()}{@render removeButton(pending.name)}{/snippet}
						</SectionRow>
					{/each}
				</ul>
				<ul class="grid gap-1 px-1 type-caption text-cover-muted-foreground">
					{#each notebook.pending as pending (pending.name)}
						<li>{pending.name} {pending.reason}.</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/snippet}

	{#snippet confirmBar(inLinen: boolean)}
		<p
			id="confirm-reason"
			class="type-caption {inLinen
				? 'text-center text-cover-muted-foreground'
				: 'text-desk-muted-foreground'}"
		>
			{reason ?? 'After Setup, placements never move.'}
		</p>
		<Button
			variant={inLinen ? 'paper' : 'default'}
			size={inLinen ? 'default' : 'lg'}
			class={inLinen ? 'h-11 w-full' : ''}
			disabled={reason !== undefined}
			aria-describedby="confirm-reason"
			onclick={() => (confirmOpen = true)}>Confirm Setup</Button
		>
	{/snippet}

	{#if desk.current}
		<div class="grid min-h-dvh grid-cols-[400px_minmax(0,1fr)]">
			<aside class="sn-linen grid content-start gap-4 p-6">
				<Button
					variant="ghost"
					class="-ml-2 justify-self-start text-cover-foreground hover:bg-white/10 hover:text-cover-foreground"
					href={resolve('/')}><ChevronLeft />Your Notebooks</Button
				>
				<header class="grid gap-1">
					<h1 class="type-display">Setup</h1>
					<p class="type-caption text-cover-muted-foreground">
						{name} · {notebook.pageCount} pages
					</p>
				</header>
				{@render note()}
				<div class="rounded-lg bg-card p-4 text-card-foreground shadow-(--shadow-slip)">
					<AddSectionForm
						pageCount={notebook.pageCount}
						{taken}
						onadd={(r) => addSection(current, r)}
					/>
				</div>
				{#if failure}
					<p role="alert" class="type-caption text-cover-foreground">{failure}</p>
				{/if}
				{@render lists()}
			</aside>
			<section class="grid content-start gap-4 bg-desk p-8 pt-18" aria-labelledby="where-pages-go">
				<div class="grid gap-1">
					<h2 id="where-pages-go" class="type-title">Where every page goes</h2>
					<p class="text-desk-muted-foreground">
						Each square is a page, 16 to a row. A filled square is a Section's Title Page.
					</p>
				</div>
				{@render grid()}
				<div class="flex items-center justify-end gap-4">
					{@render confirmBar(false)}
				</div>
			</section>
		</div>
	{:else}
		<div class="sn-linen min-h-dvh">
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
				<Button variant="paper" class="h-11 justify-self-start" onclick={() => (sheetOpen = true)}
					>Add Section</Button
				>
				{#if failure}
					<p role="alert" class="type-caption text-cover-foreground">{failure}</p>
				{/if}
				{@render lists()}
			</main>
			<footer
				class="sn-linen fixed inset-x-0 bottom-0 grid gap-2 border-t border-board px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
			>
				{@render confirmBar(true)}
			</footer>
		</div>
		<Sheet.Root bind:open={sheetOpen}>
			<Sheet.Content>
				<Sheet.Header>
					<Sheet.Title>Add Section</Sheet.Title>
					<Sheet.Description>
						{name} · {free} Free {free === 1 ? 'Page' : 'Pages'} left
					</Sheet.Description>
				</Sheet.Header>
				<AddSectionForm
					pageCount={notebook.pageCount}
					{taken}
					onadd={(r) => addSection(current, r)}
				/>
			</Sheet.Content>
		</Sheet.Root>
	{/if}

	<Dialog.Root bind:open={confirmOpen}>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Confirm Setup?</Dialog.Title>
				<Dialog.Description>
					Write each Section's name on its Title Page in your paper notebook:
				</Dialog.Description>
			</Dialog.Header>
			<ul class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 tabular-nums">
				{#each titlePages(notebook) as title (title.titlePage)}
					<li class="contents">
						<span class="type-caption">page {title.titlePage}</span>
						<span class="sn-slip sn-sec--{title.colour} justify-self-start">{title.name}</span>
					</li>
				{/each}
			</ul>
			<p class="text-muted-foreground">
				After Setup, these placements never move.
				{#if notebook.pending.length > 0}
					{notebook.pending.map((p) => p.name).join(', ')}
					{notebook.pending.length === 1 ? 'waits' : 'wait'} for your next Notebook.
				{/if}
			</p>
			{#if failure}
				<p role="alert" class="type-caption text-destructive">{failure}</p>
			{/if}
			<Dialog.Footer>
				<Dialog.Close>
					{#snippet child({ props })}
						<Button variant="outline" {...props}>Keep editing</Button>
					{/snippet}
				</Dialog.Close>
				<Button disabled={confirming} onclick={() => confirmSetup(current)}>Confirm Setup</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
