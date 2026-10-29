<script module lang="ts">
	export const title = 'Colour';
	export const order = 10;
</script>

<script lang="ts">
	import tokens from '$lib/design/tokens.json';

	type Value = string | { light: string; dark: string };

	const byName = new Map(tokens.color.tokens.map((token) => [token.name, token.value as Value]));

	/** A theme's literal colour, following `{alias}` values to the token they name. */
	function literal(value: Value, theme: 'light' | 'dark'): string {
		const raw = typeof value === 'string' ? value : value[theme];
		const alias = raw.match(/^\{(.+)\}$/);
		return alias ? literal(byName.get(alias[1])!, theme) : raw;
	}

	const groups = [
		{
			heading: 'shadcn-svelte slots',
			note: 'Same names as the base, with Subnote values. Stock components read these.',
			tokens: tokens.color.tokens.filter((token) => token.usage.startsWith('shadcn-svelte slot'))
		},
		{
			heading: "Subnote's own",
			note: 'The room, the paper and the book. Only Subnote components use these.',
			tokens: tokens.color.tokens.filter(
				(token) =>
					!token.usage.startsWith('shadcn-svelte slot') && !token.name.startsWith('section-')
			)
		},
		{
			heading: 'Section colours',
			note: 'Ink for the edge band and the name; tint for the tab paper. Assigned in this order.',
			tokens: tokens.color.tokens.filter((token) => token.name.startsWith('section-'))
		}
	];
</script>

<p class="text-muted-foreground">
	The large chip is the live CSS variable in the current theme. The small chips are the Paper
	(light) and Night (dark) values from tokens.json.
</p>

{#each groups as group (group.heading)}
	<div class="grid gap-3">
		<div>
			<h3 class="type-label">{group.heading}</h3>
			<p class="type-caption text-muted-foreground">{group.note}</p>
		</div>
		<ul class="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3">
			{#each group.tokens as token (token.name)}
				{@const value = token.value as Value}
				<li class="grid gap-2 rounded-lg border bg-card p-2">
					<div
						class="h-14 rounded-md border"
						style:background="var(--{token.name})"
						title={token.usage}
					></div>
					<code class="type-caption [overflow-wrap:anywhere]">{token.name}</code>
					<dl class="grid gap-1">
						{#each ['light', 'dark'] as const as theme (theme)}
							<div class="flex items-center gap-2">
								<span
									class="size-4 shrink-0 rounded-sm border"
									style:background={literal(value, theme)}
								></span>
								<dt class="sr-only">{theme === 'light' ? 'Paper' : 'Night'}</dt>
								<dd class="type-caption [overflow-wrap:anywhere] text-muted-foreground">
									{literal(value, theme)}
								</dd>
							</div>
						{/each}
					</dl>
				</li>
			{/each}
		</ul>
	</div>
{/each}
