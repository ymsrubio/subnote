<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import FirstVisit from '$lib/components/first-visit.svelte';
	import { notebookStore } from '$lib/storage';

	let firstVisit = $state(false);

	onMount(async () => {
		const [saved] = await notebookStore.list();
		if (saved)
			await goto(resolve('/notebooks/[id]/setup', { id: saved.id }), { replaceState: true });
		else firstVisit = true;
	});
</script>

<svelte:head><title>Subnote</title></svelte:head>

{#if firstVisit}
	<FirstVisit />
{/if}
