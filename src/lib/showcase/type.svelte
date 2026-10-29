<script module lang="ts">
	export const title = 'Type';
	export const order = 20;
</script>

<script lang="ts">
	import tokens from '$lib/design/tokens.json';

	// Written out in full so Tailwind finds each class.
	const classes: Record<string, string> = {
		display: 'type-display',
		'cover-title': 'type-cover-title',
		'cover-title-wide': 'type-cover-title-wide',
		'cover-count': 'type-cover-count',
		title: 'type-title',
		body: 'type-body',
		label: 'type-label',
		caption: 'type-caption',
		numeral: 'type-numeral',
		'section-title': 'type-section-title',
		'section-name': 'type-section-name',
		'pencil-note': 'type-pencil-note',
		tab: 'type-tab'
	};
</script>

{#each tokens.type.groups as group (group.name)}
	<div class="grid gap-3">
		<div>
			<h3 class="type-label">{group.name}</h3>
			<p class="type-caption text-muted-foreground">{group.note}</p>
		</div>
		<ul class="grid divide-y rounded-lg border bg-card">
			{#each group.styles as style (style.name)}
				<li class="grid gap-1 p-4 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
					<div>
						<code class="type-caption">type-{style.name}</code>
						<p class="type-caption text-muted-foreground">
							{style.fontSize} / {style.lineHeight} · {style.fontWeight}
						</p>
					</div>
					<div class="grid min-w-0 gap-1">
						<p
							class="{classes[style.name]} [overflow-wrap:anywhere]"
							class:cover-sample={style.name.startsWith('cover-')}
						>
							{style.sample}
						</p>
						<p class="type-caption text-muted-foreground">{style.usage}</p>
					</div>
				</li>
			{/each}
		</ul>
	</div>
{/each}

<style>
	/* Cover styles are set on the linen cover, as on a cover header. */
	.cover-sample {
		justify-self: start;
		padding: var(--space-2) var(--space-3);
		border-radius: var(--radius-md);
		background: var(--cover);
		color: var(--cover-foreground);
	}
</style>
