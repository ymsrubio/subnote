<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { removeDialogOf } from '$lib/notebook/notebook-text';
	import type { PlacedSection } from '$lib/placement';

	interface Props {
		open: boolean;
		/** The Section the person chose. Kept while the Dialog fades out. */
		section: Pick<PlacedSection, 'name' | 'colour' | 'first' | 'last' | 'size'> | null;
		/** Resolves to a message to show in the Dialog, or undefined once the Section is removed. */
		onremove: () => Promise<string | undefined>;
		onCloseAutoFocus?: (event: Event) => void;
	}

	let { open = $bindable(), section, onremove, onCloseAutoFocus }: Props = $props();

	let failure = $state('');
	let saving = $state(false);

	const words = $derived(section ? removeDialogOf(section) : null);

	$effect(() => {
		if (!open) failure = '';
	});

	async function confirm() {
		failure = '';
		saving = true;
		try {
			failure = (await onremove()) ?? '';
		} finally {
			saving = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content {onCloseAutoFocus}>
		{#if words}
			<Dialog.Header>
				<Dialog.Title
					>Remove <span class="sn-slip sn-sec--{section?.colour}">{words.name}</span>?</Dialog.Title
				>
				<Dialog.Description>{words.description}</Dialog.Description>
			</Dialog.Header>
			<p>{words.note}</p>
			{#if failure}
				<p role="alert" class="type-caption text-destructive">{failure}</p>
			{/if}
			<Dialog.Footer>
				<Dialog.Close>
					{#snippet child({ props })}
						<Button variant="outline" class="max-md:h-11" {...props}>Keep Section</Button>
					{/snippet}
				</Dialog.Close>
				<Button variant="destructive" class="max-md:h-11" disabled={saving} onclick={confirm}
					>Remove Section</Button
				>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
