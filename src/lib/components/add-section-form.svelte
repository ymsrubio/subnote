<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input, InputHelp } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { SectionRequest } from '$lib/placement';
	import { parseSectionForm, roundsUpHelp } from '$lib/setup/setup-sections';

	interface Props {
		pageCount: number;
		/** Names already used by placed or Pending Sections. */
		taken: string[];
		/** Called with a valid request. The form clears afterwards. */
		onadd: (request: SectionRequest) => void;
	}

	let { pageCount, taken, onadd }: Props = $props();

	let name = $state('');
	let pages = $state('');
	let errors = $state<{ name?: string; pages?: string }>({});
	let nameInput = $state<HTMLInputElement | null>(null);

	function submit(event: SubmitEvent) {
		event.preventDefault();
		const result = parseSectionForm({ name, pages }, pageCount, taken);
		if (!result.ok) {
			errors = result.errors;
			return;
		}
		errors = {};
		onadd(result.request);
		name = '';
		pages = '';
		nameInput?.focus();
	}
</script>

<form class="grid gap-3" novalidate onsubmit={submit} aria-label="Add a Section">
	<div class="grid grid-cols-[minmax(0,1fr)_7rem] items-start gap-3">
		<div class="grid gap-2">
			<Label for="section-name">Section name</Label>
			<Input
				id="section-name"
				bind:ref={nameInput}
				placeholder="Habit tracker"
				autocomplete="off"
				bind:value={name}
				aria-invalid={errors.name ? true : undefined}
				aria-describedby={errors.name ? 'section-name-error' : undefined}
			/>
		</div>
		<div class="grid gap-2">
			<Label for="section-pages">Pages wanted</Label>
			<Input
				id="section-pages"
				inputmode="numeric"
				placeholder="20"
				autocomplete="off"
				bind:value={pages}
				aria-invalid={errors.pages ? true : undefined}
				aria-describedby={errors.pages ? 'section-pages-error' : 'section-pages-help'}
			/>
		</div>
	</div>
	{#if errors.name}
		<InputHelp id="section-name-error" error>{errors.name}</InputHelp>
	{/if}
	{#if errors.pages}
		<InputHelp id="section-pages-error" error>{errors.pages}</InputHelp>
	{/if}
	<InputHelp id="section-pages-help">{roundsUpHelp(pages, pageCount)}</InputHelp>
	<Button type="submit" variant="secondary" class="h-11 justify-self-start md:h-9">
		Add Section
	</Button>
</form>
