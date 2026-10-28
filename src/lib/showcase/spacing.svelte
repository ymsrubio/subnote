<script module lang="ts">
	export const title = 'Spacing';
	export const order = 30;
</script>

<script lang="ts">
	import tokens from '$lib/design/tokens.json';

	const steps = tokens.spacing.tokens.filter((token) => token.name.startsWith('space-'));
	const pageMargin = tokens.spacing.tokens.find((token) => token.name === 'page-margin')!;
</script>

<p class="text-muted-foreground">{tokens.spacing.note}</p>

<ul class="grid divide-y rounded-lg border bg-card">
	{#each steps as step (step.name)}
		<li class="grid grid-cols-[5rem_2rem_minmax(0,1fr)] items-center gap-3 p-3">
			<code class="type-caption">{step.name}</code>
			<span class="type-caption text-muted-foreground">{step.value}</span>
			<div class="flex min-w-0 items-center gap-3">
				<span class="h-4 shrink-0 rounded-sm bg-primary" style:width="var(--{step.name})"></span>
				<span class="min-w-0 type-caption text-muted-foreground">{step.usage}</span>
			</div>
		</li>
	{/each}
	<li class="grid grid-cols-[5rem_2rem_minmax(0,1fr)] items-center gap-3 p-3">
		<code class="type-caption [overflow-wrap:anywhere]">{pageMargin.name}</code>
		<span class="type-caption text-muted-foreground">{pageMargin.value}</span>
		<span class="type-caption text-muted-foreground">{pageMargin.usage}</span>
	</li>
</ul>
