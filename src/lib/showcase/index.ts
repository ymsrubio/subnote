import type { Component } from 'svelte';

/** One showcase example: a Svelte file in this folder whose module script exports these. */
export interface Example {
	title: string;
	/** Position on the page, lowest first. */
	order: number;
	default: Component;
}

const modules = import.meta.glob<Example>('./*.svelte', { eager: true });

export const examples = Object.entries(modules)
	.map(([path, example]) => ({ ...example, id: path.replace(/^\.\/|\.svelte$/g, '') }))
	.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
