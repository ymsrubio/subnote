<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import NotebookMissing from '$lib/components/notebook-missing.svelte';
	import StorageBlocked from '$lib/components/storage-blocked.svelte';
	import { notebookStore, type SavedNotebook } from '$lib/storage';

	// A stand-in until the real Notebook screen replaces it: the name and the placed Sections.
	let saved = $state<SavedNotebook | 'missing' | 'blocked'>();

	onMount(async () => {
		const id = page.params.id ?? '';
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
	<main class="mx-auto grid max-w-md gap-4 px-5 py-10">
		<h1 class="type-display">{saved.name}</h1>
		<ul class="grid gap-1" aria-label="Sections">
			{#each [...saved.notebook.sections].sort((a, b) => a.first - b.first) as section (section.name)}
				<li>{section.name}, pages {section.first}–{section.last}</li>
			{/each}
		</ul>
	</main>
{/if}
