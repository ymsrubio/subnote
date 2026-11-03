<script module lang="ts">
	export const title = 'Sheet';
	export const order = 130;
</script>

<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input, InputHelp } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Sheet from '$lib/components/ui/sheet';
</script>

<p class="text-muted-foreground">
	One form, two shapes. Below 768px it rises from the bottom with 44px controls. From 768px it is a
	centred Dialog with the usual 36 and 40px controls. The scrim dims the book and its tabs behind
	it.
</p>
<div class="flex flex-wrap items-center gap-3">
	<Sheet.Root>
		<Sheet.Trigger>
			{#snippet child({ props })}
				<Button {...props}>Add Section</Button>
			{/snippet}
		</Sheet.Trigger>
		<Sheet.Content>
			<Sheet.Header>
				<Sheet.Title>Add Section</Sheet.Title>
				<Sheet.Description>
					It takes the next free pages in Spring notebook. Placed after <span
						class="sn-slip sn-sec--sage">Habit tracker</span
					>.
				</Sheet.Description>
			</Sheet.Header>
			<div class="grid gap-2">
				<Label for="sheet-section-name">Section name</Label>
				<Input id="sheet-section-name" placeholder="Reading log" />
			</div>
			<div class="grid gap-2">
				<Label for="sheet-pages">Pages wanted</Label>
				<Input
					id="sheet-pages"
					inputmode="numeric"
					value="20"
					aria-describedby="sheet-pages-help"
				/>
				<InputHelp id="sheet-pages-help">Rounds up to 32 pages.</InputHelp>
			</div>
			<Sheet.Footer>
				<Sheet.Close>
					{#snippet child({ props })}
						<Button variant="outline" {...props}>Cancel</Button>
					{/snippet}
				</Sheet.Close>
				<Sheet.Close>
					{#snippet child({ props })}
						<Button {...props}>Add Section</Button>
					{/snippet}
				</Sheet.Close>
			</Sheet.Footer>
		</Sheet.Content>
	</Sheet.Root>
	<div
		data-testid="stacked-book"
		class="relative z-9 flex items-end gap-1 rounded-md border bg-paper px-4 pt-3 pb-2 shadow-(--shadow-tab)"
	>
		<span class="sn-slip sn-sec--sage">Habit tracker</span>
		<span class="sn-slip sn-sec--plum">Reading log</span>
	</div>
</div>
