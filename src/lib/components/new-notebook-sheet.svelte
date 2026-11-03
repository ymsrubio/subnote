<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input, InputHelp } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Sheet from '$lib/components/ui/sheet';
	import { validateNewNotebook } from '$lib/new-notebook';

	interface Props {
		open: boolean;
		/** Called with a valid name and page count. Throw to show the message in the form. */
		onsubmit: (name: string, pageCount: number) => Promise<void>;
	}

	let { open = $bindable(), onsubmit }: Props = $props();

	let name = $state('');
	let pages = $state('');
	let errors = $state<{ name?: string; pages?: string }>({});
	let failure = $state('');
	let saving = $state(false);

	$effect(() => {
		if (open) return;
		name = '';
		pages = '';
		errors = {};
		failure = '';
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const result = validateNewNotebook({ name, pages });
		if (!result.ok) {
			errors = result.errors;
			return;
		}
		errors = {};
		failure = '';
		saving = true;
		try {
			await onsubmit(result.name, result.pageCount);
		} catch {
			failure =
				'Subnote could not save this Notebook on this device. Check that storage is allowed.';
		} finally {
			saving = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content>
		<form class="grid gap-4" novalidate onsubmit={submit}>
			<Sheet.Header>
				<Sheet.Title>New Notebook</Sheet.Title>
				<Sheet.Description>
					Name your paper notebook and count its pages. Next, in Setup, you'll decide what every
					page is for.
				</Sheet.Description>
			</Sheet.Header>
			<div class="grid gap-2">
				<Label for="notebook-name">Notebook name</Label>
				<Input
					id="notebook-name"
					placeholder="Spring notebook"
					autocomplete="off"
					bind:value={name}
					aria-invalid={errors.name ? true : undefined}
					aria-describedby={errors.name ? 'notebook-name-error' : undefined}
				/>
				{#if errors.name}
					<InputHelp id="notebook-name-error" error>{errors.name}</InputHelp>
				{/if}
			</div>
			<div class="grid gap-2">
				<Label for="notebook-pages">Pages</Label>
				<Input
					id="notebook-pages"
					class="max-w-30"
					inputmode="numeric"
					placeholder="120"
					autocomplete="off"
					bind:value={pages}
					aria-invalid={errors.pages ? true : undefined}
					aria-describedby={errors.pages ? 'notebook-pages-error' : 'notebook-pages-help'}
				/>
				{#if errors.pages}
					<InputHelp id="notebook-pages-error" error>{errors.pages}</InputHelp>
				{:else}
					<InputHelp id="notebook-pages-help"
						>Count every numbered page in the paper notebook.</InputHelp
					>
				{/if}
			</div>
			{#if failure}
				<InputHelp error role="alert">{failure}</InputHelp>
			{/if}
			<Sheet.Footer>
				<Sheet.Close>
					{#snippet child({ props })}
						<Button variant="outline" {...props}>Cancel</Button>
					{/snippet}
				</Sheet.Close>
				<Button type="submit" disabled={saving}>Start Setup</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
