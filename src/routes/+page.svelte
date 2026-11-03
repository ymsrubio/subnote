<script lang="ts">
	import { onMount } from 'svelte';
	import FirstVisit from '$lib/components/first-visit.svelte';
	import NotebookList from '$lib/components/notebook-list.svelte';
	import StorageBlocked from '$lib/components/storage-blocked.svelte';
	import { notebookStore, type SavedNotebook } from '$lib/storage';

	let view = $state<'loading' | 'first-visit' | 'blocked' | SavedNotebook[]>('loading');

	onMount(async () => {
		try {
			const notebooks = await notebookStore.list();
			view = notebooks.length > 0 ? notebooks : 'first-visit';
		} catch {
			view = 'blocked';
		}
	});
</script>

<svelte:head><title>Subnote</title></svelte:head>

{#if view === 'first-visit'}
	<FirstVisit />
{:else if view === 'blocked'}
	<StorageBlocked />
{:else if view !== 'loading'}
	<NotebookList notebooks={view} />
{/if}
