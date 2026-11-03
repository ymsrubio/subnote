<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
</script>

<main class="mx-auto grid min-h-dvh max-w-md content-center justify-items-start gap-4 px-5">
	<h1 class="type-cover-title">That Notebook isn't on this device</h1>
	<p class="text-muted-foreground">
		Notebooks are saved on the device where you made them. Start a new one here, or open Subnote on
		the device that has it.
	</p>
	<Button class="h-11 md:h-9" href={resolve('/')}>Back to Subnote</Button>
</main>
