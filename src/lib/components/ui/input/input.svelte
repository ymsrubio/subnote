<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';

	type Props = WithElementRef<
		Omit<HTMLInputAttributes, 'type'> & { type?: Exclude<HTMLInputTypeAttribute, 'file'> }
	>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		class: className,
		'data-slot': dataSlot = 'input',
		...restProps
	}: Props = $props();
</script>

<input
	bind:this={ref}
	data-slot={dataSlot}
	class={cn(
		'h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 text-foreground transition-[border-color,box-shadow] outline-none type-body placeholder:text-muted-foreground focus-visible:shadow-(--focus-ring) disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
		className
	)}
	{type}
	bind:value
	{...restProps}
/>
