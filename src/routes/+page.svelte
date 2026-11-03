<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import FirstVisit from '$lib/components/first-visit.svelte';
	import StorageBlocked from '$lib/components/storage-blocked.svelte';
	import { notebookStore } from '$lib/storage';

	let view = $state<'loading' | 'first-visit' | 'blocked'>('loading');

	onMount(async () => {
		try {
			const [saved] = await notebookStore.list();
			if (saved)
				await goto(resolve('/notebooks/[id]/setup', { id: saved.id }), { replaceState: true });
			else view = 'first-visit';
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
{/if}
