<script module lang="ts">
	export const title = 'Radius and shadow';
	export const order = 40;
</script>

<script lang="ts">
	import tokens from '$lib/design/tokens.json';
</script>

<div class="grid gap-3">
	<p class="text-muted-foreground">{tokens.radius.note}</p>
	<ul class="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3">
		{#each tokens.radius.tokens as radius (radius.name)}
			<li class="grid gap-2">
				<div
					class="h-16 border-2 border-input bg-card"
					style:border-radius="var(--{radius.name})"
				></div>
				<code class="type-caption">{radius.name} · {radius.value}</code>
				<p class="type-caption text-muted-foreground">{radius.usage}</p>
			</li>
		{/each}
	</ul>
</div>

<div class="grid gap-3">
	<p class="text-muted-foreground">{tokens.shadow.note}</p>
	<ul class="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-6">
		{#each tokens.shadow.tokens as shadow (shadow.name)}
			<li class="grid gap-2">
				<div class="h-16 rounded-lg bg-paper" style:box-shadow="var(--{shadow.name})"></div>
				<code class="type-caption">{shadow.name}</code>
				<p class="type-caption text-muted-foreground">{shadow.usage}</p>
			</li>
		{/each}
	</ul>
</div>
