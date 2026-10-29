<script module lang="ts">
	export const title = 'Button';
	export const order = 100;
</script>

<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="grid gap-3">
	<p class="text-muted-foreground">
		Six variants from shadcn-svelte. One default button per screen, for what the screen is for.
	</p>
	<div class="flex flex-wrap items-center gap-3">
		<Button>Confirm Setup</Button>
		<Button variant="secondary">Add Section</Button>
		<Button variant="outline">Start next Notebook</Button>
		<Button variant="ghost">Cancel</Button>
		<Button variant="destructive">Remove Section</Button>
		<Button variant="link">How placement works</Button>
	</div>
</div>

<div class="grid gap-3">
	<p class="text-muted-foreground">Four sizes: 32, 36 and 40px, and a 36px square for an icon.</p>
	<div class="flex flex-wrap items-center gap-3">
		<Button variant="outline" size="sm">Small</Button>
		<Button variant="outline">Default</Button>
		<Button variant="outline" size="lg">Large</Button>
		<Button variant="outline" size="icon" aria-label="Turn the page"><ChevronRight /></Button>
	</div>
</div>

<div class="grid gap-3">
	<p class="text-muted-foreground">
		Disable the main action only when it can't work yet, and say why next to it.
	</p>
	<div class="flex flex-wrap items-center gap-3">
		<Button disabled aria-describedby="button-disabled-reason">Confirm Setup</Button>
		<p id="button-disabled-reason" class="type-caption text-muted-foreground">
			Add a Section to confirm Setup.
		</p>
	</div>
</div>

<div class="grid gap-3">
	<p class="text-muted-foreground">
		On linen, the one main action is a paper button. Ghost buttons take the cover's ink.
	</p>
	<div class="grid gap-4 rounded-lg bg-cover p-4 text-cover-foreground">
		<div class="flex flex-wrap items-center gap-3">
			<Button variant="paper">Add Section</Button>
			<Button
				variant="ghost"
				class="text-cover-foreground hover:bg-white/10 hover:text-cover-foreground"
			>
				Your Notebooks
			</Button>
		</div>
		<div class="flex flex-wrap items-center gap-3">
			<Button variant="paper" disabled aria-describedby="button-paper-disabled-reason">
				Confirm Setup
			</Button>
			<p id="button-paper-disabled-reason" class="type-caption text-cover-muted-foreground">
				Add a Section to confirm Setup.
			</p>
		</div>
	</div>
</div>
