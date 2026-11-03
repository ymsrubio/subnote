<script lang="ts">
	import { cn } from '$lib/utils.js';
	import DialogContent from '../dialog/dialog-content.svelte';
	import type { ComponentProps } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ComponentProps<typeof DialogContent> = $props();
</script>

<DialogContent
	bind:ref
	data-slot="sheet-content"
	class={cn(
		'flex max-h-[calc(100dvh-24px)] flex-col gap-0 overflow-hidden p-0 md:max-h-[calc(100dvh-48px)]',
		'max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:w-full max-md:max-w-none max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-t-lg max-md:rounded-b-none max-md:border-b-0 max-md:duration-200 max-md:data-open:zoom-in-100 max-md:data-open:slide-in-from-bottom max-md:data-closed:zoom-out-100 max-md:data-closed:slide-out-to-bottom',
		className
	)}
	{...restProps}
>
	<span
		aria-hidden="true"
		data-slot="sheet-grab"
		class="absolute top-2 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-muted-foreground md:hidden"
	></span>
	<div
		class="grid min-h-0 gap-4 overflow-y-auto overscroll-contain p-6 max-md:pt-8 max-md:pb-[max(1.5rem,env(safe-area-inset-bottom))] max-md:[&_[data-slot=button]:not([data-variant=link],[data-size=icon])]:h-11 max-md:[&_[data-slot=input]]:h-11"
	>
		{@render children?.()}
	</div>
</DialogContent>
