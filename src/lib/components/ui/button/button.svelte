<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	export const buttonVariants = tv({
		base: "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md border border-transparent whitespace-nowrap type-label transition-[background-color,box-shadow] outline-none select-none focus-visible:shadow-(--focus-ring) disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
		variants: {
			variant: {
				default:
					'bg-primary text-primary-foreground hover:bg-[image:linear-gradient(rgb(255_255_255/0.1),rgb(255_255_255/0.1))]',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground',
				outline:
					'border-input bg-card text-foreground hover:bg-accent hover:text-accent-foreground',
				ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
				destructive:
					'bg-destructive text-destructive-foreground hover:bg-[image:linear-gradient(rgb(255_255_255/0.1),rgb(255_255_255/0.1))]',
				link: 'text-foreground underline underline-offset-4',
				paper:
					'bg-paper text-slip-foreground shadow-(--shadow-slip) hover:bg-[image:linear-gradient(rgb(255_255_255/0.25),rgb(255_255_255/0.25))]'
			},
			size: {
				sm: 'h-8 px-3 text-[13px]!',
				default: 'h-9 px-4',
				lg: 'h-10 px-6',
				icon: 'size-9 text-[18px]!'
			}
		},
		compoundVariants: [{ variant: 'link', class: 'h-auto px-0' }],
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<!-- Callers pass an href they already resolved. -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? 'link' : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
