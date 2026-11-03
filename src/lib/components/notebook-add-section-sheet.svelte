<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input, InputHelp } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Sheet from '$lib/components/ui/sheet';
	import { freeSummary, previewOf } from '$lib/notebook/notebook-text';
	import { previewAddSection, type PlacementOutcome, type SectionRequest } from '$lib/placement';
	import { parseSectionForm, roundsUpHelp } from '$lib/setup/setup-sections';
	import type { SavedNotebook } from '$lib/storage';

	interface Props {
		open: boolean;
		saved: SavedNotebook;
		/**
		 * Called with the request and the outcome the preview showed. Resolves to a message to show in
		 * the form, or undefined once the Section is added.
		 */
		onadd: (request: SectionRequest, shown: PlacementOutcome) => Promise<string | undefined>;
	}

	let { open = $bindable(), saved, onadd }: Props = $props();

	let name = $state('');
	let pages = $state('');
	let errors = $state<{ name?: string; pages?: string }>({});
	let failure = $state('');
	let saving = $state(false);
	let nameInput = $state<HTMLInputElement | null>(null);
	let pagesInput = $state<HTMLInputElement | null>(null);

	const notebook = $derived(saved.notebook);
	const taken = $derived([...notebook.sections, ...notebook.pending].map((s) => s.name));
	const parsed = $derived(parseSectionForm({ name, pages }, notebook.pageCount, taken));
	/** Null until a name and a page count are both valid. */
	const outcome = $derived(parsed.ok ? previewAddSection(notebook, parsed.request) : null);
	const preview = $derived(outcome ? previewOf(outcome, saved.name) : null);

	$effect(() => {
		if (open) return;
		name = '';
		pages = '';
		errors = {};
		failure = '';
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!parsed.ok || !outcome) {
			errors = parsed.ok ? {} : parsed.errors;
			(errors.name ? nameInput : pagesInput)?.focus();
			return;
		}
		errors = {};
		failure = '';
		saving = true;
		try {
			failure = (await onadd(parsed.request, outcome)) ?? '';
		} finally {
			saving = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content>
		<form class="grid gap-4" novalidate onsubmit={submit} aria-label="Add a Section">
			<Sheet.Header>
				<Sheet.Title>Add Section</Sheet.Title>
				<Sheet.Description>{saved.name} · {freeSummary(notebook)}</Sheet.Description>
			</Sheet.Header>
			<div class="grid grid-cols-[minmax(0,1fr)_7rem] items-start gap-3">
				<div class="grid gap-2">
					<Label for="add-section-name">Section name</Label>
					<Input
						id="add-section-name"
						bind:ref={nameInput}
						placeholder="Habit tracker"
						autocomplete="off"
						bind:value={name}
						aria-invalid={errors.name ? true : undefined}
						aria-describedby={errors.name ? 'add-section-name-error' : undefined}
					/>
				</div>
				<div class="grid gap-2">
					<Label for="add-section-pages">Pages wanted</Label>
					<Input
						id="add-section-pages"
						bind:ref={pagesInput}
						inputmode="numeric"
						placeholder="20"
						autocomplete="off"
						bind:value={pages}
						aria-invalid={errors.pages ? true : undefined}
						aria-describedby={errors.pages ? 'add-section-pages-error' : 'add-section-pages-help'}
					/>
				</div>
			</div>
			{#if errors.name}
				<InputHelp id="add-section-name-error" error>{errors.name}</InputHelp>
			{/if}
			{#if errors.pages}
				<InputHelp id="add-section-pages-error" error>{errors.pages}</InputHelp>
			{/if}
			<InputHelp id="add-section-pages-help">{roundsUpHelp(pages, notebook.pageCount)}</InputHelp>

			{#if preview?.kind === 'fits'}
				<div
					class="sn-sec--{preview.colour} grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-lg bg-card p-4 shadow-(--shadow-slip)"
					role="status"
				>
					<span><span class="sn-slip">{preview.name}</span></span>
					<span class="tabular-nums type-label">{preview.range}</span>
					<InputHelp class="col-span-2">{preview.instruction}</InputHelp>
				</div>
			{:else if preview?.kind === 'pending'}
				<div class="rounded-lg bg-card p-4 shadow-(--shadow-slip)" role="status">
					<p><strong>{preview.title}</strong> {preview.detail}</p>
				</div>
			{/if}

			{#if failure}
				<InputHelp error role="alert">{failure}</InputHelp>
			{/if}
			<Sheet.Footer>
				<Sheet.Close>
					{#snippet child({ props })}
						<Button variant="outline" {...props}>Cancel</Button>
					{/snippet}
				</Sheet.Close>
				<Button type="submit" disabled={saving}>
					{preview?.kind === 'pending' ? 'Add as Pending Section' : 'Add Section'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
