<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		error = false,
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLParagraphElement>> & { error?: boolean } = $props();
</script>

<p
	bind:this={ref}
	data-slot="input-help"
	class={cn('text-[13px]/[18px] text-muted-foreground', error && 'text-destructive', className)}
	{...restProps}
>
	{@render children?.()}
</p>
