<script lang="ts">
	import { examples } from '$lib/showcase';
</script>

<svelte:head><title>Design system · Subnote</title></svelte:head>

<main class="mx-auto grid max-w-5xl gap-8 px-4 py-8">
	<header class="grid gap-2">
		<h1 class="type-display">Design system</h1>
		<p class="text-muted-foreground">
			Subnote's tokens and components. The theme follows your system's light or dark setting.
		</p>
		<nav aria-label="Examples">
			<ul class="flex flex-wrap gap-x-4 gap-y-1">
				{#each examples as example (example.id)}
					<li>
						<a class="underline underline-offset-4 type-label" href="#{example.id}"
							>{example.title}</a
						>
					</li>
				{/each}
			</ul>
		</nav>
	</header>

	{#each examples as example (example.id)}
		<section
			id={example.id}
			class="grid min-w-0 scroll-mt-4 gap-4"
			aria-labelledby="{example.id}-title"
		>
			<h2 id="{example.id}-title" class="type-title">{example.title}</h2>
			<example.default />
		</section>
	{/each}
</main>
