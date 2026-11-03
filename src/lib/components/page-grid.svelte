<script lang="ts">
	import { planGrid, type GridSection } from '$lib/design/page-grid';

	interface Props {
		/** The Notebook's name, for the grid's label. */
		name: string;
		pageCount: number;
		/** Placed Sections. The grid does no placement: each is `size` pages from `first`, `first` being its Title Page. */
		sections: GridSection[];
	}

	let { name, pageCount, sections }: Props = $props();

	const plan = $derived(planGrid(name, pageCount, sections));
	const free = $derived(plan.free);
</script>

<div class="grid gap-3 rounded-lg border bg-card p-4 text-card-foreground">
	<div class="sn-grid-frame">
		<div class="sn-grid" role="img" aria-label={plan.label}>
			{#each plan.rows as row (row.first)}
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
							<span class="sn-grid__name sn-slip sn-sec--{section.colour}" title={section.name}
								>{section.name}</span
							>
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

	@container (min-width: 680px) {
		.sn-grid {
			grid-template-columns: 2.5rem minmax(0, 1fr) fit-content(18rem);
			column-gap: var(--space-2);
		}
		.sn-grid__row {
			display: grid;
			grid-column: 1 / -1;
			grid-template-columns: subgrid;
			align-items: center;
		}
		.sn-grid__number {
			display: block;
			text-align: right;
		}
		/* Zero height, centred on the row: slips never make a row taller than its squares. */
		.sn-grid__names {
			display: flex;
			align-items: center;
			gap: var(--space-1);
			block-size: 0;
			min-inline-size: 0;
		}
		.sn-grid__name {
			min-inline-size: 0;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
</style>
