<script module lang="ts">
	export const title = 'Input';
	export const order = 110;
</script>

<script lang="ts">
	import { Input, InputHelp } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
</script>

<p class="text-muted-foreground">
	Label above, the field on card, and a help line that explains placement as you type.
</p>
<div class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] items-start gap-6">
	<div class="grid gap-2">
		<Label for="input-section-name">Section name</Label>
		<Input id="input-section-name" placeholder="Habit tracker" />
	</div>
	<div class="grid gap-2">
		<Label for="input-pages">Pages wanted</Label>
		<Input id="input-pages" inputmode="numeric" value="20" aria-describedby="input-pages-help" />
		<InputHelp id="input-pages-help">Rounds up to 32 pages.</InputHelp>
	</div>
	<div class="grid gap-2">
		<Label for="input-pages-error">Pages wanted</Label>
		<Input
			id="input-pages-error"
			inputmode="numeric"
			value="300"
			aria-invalid="true"
			aria-describedby="input-pages-error-help"
		/>
		<InputHelp id="input-pages-error-help" error>A 128-page Notebook can't fit 300 pages.</InputHelp
		>
	</div>
</div>
