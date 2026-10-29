<script module lang="ts">
	export const title = 'Dialog';
	export const order = 120;
</script>

<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
</script>

<p class="text-muted-foreground">
	A sheet of paper over a dimmed room, asking you to confirm one thing. The scrim covers everything
	behind it, including the slip below, which has its own z-index.
</p>
<div class="flex flex-wrap items-center gap-3">
	<Dialog.Root>
		<Dialog.Trigger>
			{#snippet child({ props })}
				<Button variant="destructive" {...props}>Remove Section</Button>
			{/snippet}
		</Dialog.Trigger>
		<Dialog.Content>
			<Dialog.Header>
				<Dialog.Title>Remove Habit tracker?</Dialog.Title>
				<Dialog.Description>
					Its 32 pages (65–96) become Free Pages, and a later Section can claim them. What you've
					written on paper stays.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Dialog.Close>
					{#snippet child({ props })}
						<Button variant="outline" {...props}>Keep it</Button>
					{/snippet}
				</Dialog.Close>
				<Dialog.Close>
					{#snippet child({ props })}
						<Button variant="destructive" {...props}>Remove Section</Button>
					{/snippet}
				</Dialog.Close>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
	<span
		data-testid="stacked-slip"
		class="relative z-9 rounded-sm bg-section-sage-tint px-2 text-section-sage shadow-(--shadow-tab) type-section-name"
	>
		Habit tracker
	</span>
</div>
