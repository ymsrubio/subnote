<script lang="ts">
	import '@fontsource/nunito/latin-400.css';
	import '@fontsource/nunito/latin-600.css';
	import '@fontsource/nunito/latin-700.css';
	import '@fontsource/nunito/latin-800.css';
	import '@fontsource/gaegu/latin-400.css';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
