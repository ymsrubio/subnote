<script lang="ts">
	import { freePages, gridLabel, gridRows, type GridSection } from '$lib/design/page-grid';

	interface Props {
		/** The Notebook's name, for the grid's label. */
		name: string;
		pageCount: number;
		/** Placed Sections. The grid does no placement: each runs `first` to `last`, `first` being its Title Page. */
		sections: GridSection[];
	}

	let { name, pageCount, sections }: Props = $props();

	const rows = $derived(gridRows(pageCount, sections));
	const free = $derived(freePages(pageCount, sections));
</script>

<div class="grid gap-3 rounded-lg border bg-card p-4 text-card-foreground">
	<div class="sn-grid-frame">
		<div class="sn-grid" role="img" aria-label={gridLabel(name, pageCount, sections)}>
			{#each rows as row (row.first)}
				<div class="sn-grid__row">
					<span class="sn-grid__number text-muted-foreground type-numeral">{row.first}</span>
					<div class="sn-grid__squares">
						{#each row.cells as cell, index (index)}
							{#if cell.kind === 'empty'}
								<span class="sn-grid__sq"></span>
							{:else if cell.kind === 'free'}
								<span class="sn-grid__sq sn-grid__sq--free"></span>
							{:else}
								<span class="sn-grid__sq sn-grid__sq--{cell.kind} sn-sec--{cell.colour}"></span>
							{/if}
						{/each}
					</div>
					<span class="sn-grid__names">
						{#each row.titles as section (section.first)}
							<span class="sn-grid__name sn-slip sn-sec--{section.colour}">{section.name}</span>
						{/each}
					</span>
				</div>
			{/each}
		</div>
	</div>
	<p class="type-label">
		{free} Free {free === 1 ? 'Page' : 'Pages'} left of {pageCount}
	</p>
</div>

<style>
	.sn-grid-frame {
		container-type: inline-size;
	}
	.sn-grid {
		display: grid;
		gap: 3px;
	}
	.sn-grid__row {
		display: grid;
		grid-template-columns: 1fr;
		align-items: center;
		column-gap: var(--space-2);
	}
	.sn-grid__number,
	.sn-grid__names {
		display: none;
	}
	.sn-grid__squares {
		display: grid;
		grid-template-columns: repeat(16, minmax(0, 1fr));
		gap: 3px;
	}
	.sn-grid__sq {
		aspect-ratio: 1;
		border-radius: 2px;
	}
	.sn-grid__sq--section {
		background: var(--section-tab);
		box-shadow: inset 2px 0 0 var(--section-ink);
	}
	.sn-grid__sq--title {
		background: var(--section-ink);
		box-shadow: 0 0 0 1px var(--paper);
	}
	.sn-grid__sq--free {
		background: var(--paper);
		box-shadow: inset 0 0 0 1px var(--input);
	}
	.sn-grid__names {
		gap: var(--space-1);
		white-space: nowrap;
	}

	@container (min-width: 680px) {
		.sn-grid__row {
			grid-template-columns: 2.5rem 1fr 8.5rem;
		}
		.sn-grid__number {
			display: block;
			text-align: right;
		}
		.sn-grid__names {
			display: flex;
			flex-wrap: wrap;
		}
	}
</style>
