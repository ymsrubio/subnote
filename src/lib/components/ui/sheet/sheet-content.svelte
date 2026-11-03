<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';
	import DialogOverlay from '../dialog/dialog-overlay.svelte';
	import DialogPortal from '../dialog/dialog-portal.svelte';
	import type { ComponentProps, Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		portalProps,
		children,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DialogPortal>>;
		children: Snippet;
	} = $props();
</script>

<DialogPortal {...portalProps}>
	<DialogOverlay />
	<DialogPrimitive.Content
		bind:ref
		data-slot="sheet-content"
		class={cn(
			'fixed inset-x-0 bottom-0 z-10 grid max-h-[calc(100dvh-24px)] gap-4 overflow-y-auto overscroll-contain rounded-t-lg border border-b-0 border-border bg-popover p-6 pt-8 text-popover-foreground shadow-(--shadow-sheet) duration-200 outline-none data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom',
			'max-md:[&_:is(button,input)]:h-11',
			'md:inset-auto md:top-1/2 md:left-1/2 md:max-h-[calc(100dvh-48px)] md:w-[calc(100%-2rem)] md:max-w-[420px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-lg md:border-b md:pt-6 md:duration-100 md:data-open:fade-in-0 md:data-open:zoom-in-95 md:data-open:slide-in-from-bottom-0 md:data-closed:fade-out-0 md:data-closed:zoom-out-95 md:data-closed:slide-out-to-bottom-0',
			className
		)}
		{...restProps}
	>
		<span
			aria-hidden="true"
			data-slot="sheet-grab"
			class="absolute top-2 left-1/2 h-1 w-9 -translate-x-1/2 rounded-full bg-border md:hidden"
		></span>
		{@render children?.()}
	</DialogPrimitive.Content>
</DialogPortal>
