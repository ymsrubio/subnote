<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ClosedNotebook from '$lib/components/closed-notebook.svelte';
	import NewNotebookSheet from '$lib/components/new-notebook-sheet.svelte';
	import { Button } from '$lib/components/ui/button';
	import { newSavedNotebook, notebookStore } from '$lib/storage';

	let open = $state(false);

	async function create(name: string, pageCount: number) {
		const saved = newSavedNotebook(crypto.randomUUID(), name, pageCount);
		await notebookStore.save(saved);
		open = false;
		await goto(resolve('/notebooks/[id]/setup', { id: saved.id }));
	}
</script>

<main
	class="mx-auto grid min-h-dvh max-w-280 grid-rows-[minmax(0,1fr)_auto] md:grid-cols-2 md:grid-rows-none md:items-center md:gap-16 md:px-8"
>
	<div class="grid place-items-center pt-8 pb-4 [--bw:216px] md:order-2 md:py-0 md:[--bw:300px]">
		<ClosedNotebook />
	</div>
	<div class="grid gap-6 px-5 pb-8 md:order-1 md:max-w-115 md:gap-8 md:px-0 md:pb-0">
		<div class="grid gap-3 md:gap-4">
			<h1 class="type-cover-title md:text-[48px]/[54px]">Give every page a purpose</h1>
			<p class="text-muted-foreground">
				Tell Subnote how many pages your paper notebook has and what you'll use them for. Each
				Section gets an exact run of pages, so you know where to write every Title Page.
			</p>
		</div>
		<div class="grid gap-3 md:justify-items-start">
			<Button class="h-11 w-full md:h-10 md:w-auto md:px-6" onclick={() => (open = true)}>
				New Notebook
			</Button>
			<p class="text-center type-caption text-muted-foreground md:text-left">
				Your Notebooks are saved on this device.
			</p>
		</div>
	</div>
</main>

<NewNotebookSheet bind:open onsubmit={create} />
