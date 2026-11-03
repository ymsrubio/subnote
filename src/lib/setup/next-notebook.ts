import { setupNotebookKeepingTooBig, type SectionRequest } from '../placement';
import type { Carried, SavedNotebook } from '../storage';

/**
 * What the next Notebook's Setup starts with: the previous Notebook's Pending Sections first (they have
 * waited longest, so they win a tie on size), then the Sections it placed, each asking for the pages
 * first asked for. Sections that ask for more pages than the new Notebook has stay Pending and are named in
 * `tooBig`.
 */
export function prefillFrom(previous: SavedNotebook, pageCount: number) {
	const carried: Carried = { from: previous.name, sections: [], tooBig: [] };
	const requests: SectionRequest[] = [];
	const rows = [
		...previous.notebook.pending.map((s) => ({ s, origin: 'pending' as const })),
		...previous.notebook.sections.map((s) => ({ s, origin: 'placed' as const }))
	];
	for (const { s, origin } of rows) {
		if (s.requested > pageCount) carried.tooBig.push(s.name);
		requests.push({ name: s.name, pages: s.requested });
		carried.sections.push({ name: s.name, origin });
	}
	return { requests, carried };
}

/** A new Notebook whose draft Setup holds the previous Notebook's Sections and Pending Sections. */
export function nextSavedNotebook(
	id: string,
	name: string,
	pageCount: number,
	previous: SavedNotebook
): SavedNotebook {
	const { requests, carried } = prefillFrom(previous, pageCount);
	return {
		id,
		name,
		setupConfirmed: false,
		notebook: setupNotebookKeepingTooBig(pageCount, requests),
		carried
	};
}

/** The marker on a prefilled row: "from Spring" or "was Pending", or undefined for a row added by hand. */
export function carriedMark(saved: SavedNotebook, sectionName: string): string | undefined {
	const { carried } = saved;
	const row = carried?.sections.find((s) => s.name === sectionName);
	if (!carried || !row) return undefined;
	return row.origin === 'pending' ? 'was Pending' : `from ${carried.from}`;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * The line above a prefilled Setup: what it was filled from and what is still in it, plus any Section that stays Pending for being too big.
 * Undefined for a Notebook that was not started from another, or once every row is removed.
 */
export function prefillNote(saved: SavedNotebook): string | undefined {
	const { carried } = saved;
	if (!carried) return undefined;
	const fitting = carried.sections.filter((s) => !carried.tooBig.includes(s.name));
	const placed = fitting.filter((s) => s.origin === 'placed').length;
	const pending = fitting.length - placed;
	const parts: string[] = [];
	if (placed > 0) parts.push(`its ${plural(placed, 'Section', 'Sections')}`);
	if (pending > 0) {
		parts.push(
			`the ${plural(pending, 'Pending Section', 'Pending Sections')} that waited for this Notebook`
		);
	}
	const sentences: string[] = [];
	if (parts.length > 0) {
		sentences.push(
			`Prefilled from ${carried.from}: ${parts.join(', plus ')}. Remove any you don't need.`
		);
	}
	if (carried.tooBig.length > 0) {
		const many = carried.tooBig.length > 1;
		sentences.push(
			`${carried.tooBig.join(', ')} ${many ? 'ask' : 'asks'} for more pages than this Notebook has, so ${many ? 'they stay' : 'it stays'} Pending.`
		);
	}
	return sentences.length > 0 ? sentences.join(' ') : undefined;
}
