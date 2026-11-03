import {
	addSection,
	type Notebook,
	type PlacementOutcome,
	type SectionRequest
} from '../placement';
import type { NotebookStore, SavedNotebook } from '../storage';

export type AddSectionSave =
	| { status: 'saved'; saved: SavedNotebook; outcome: PlacementOutcome }
	/** The stored Notebook no longer gives the preview the person saw. Nothing was written. */
	| { status: 'changed'; saved: SavedNotebook }
	/** The stored Notebook rejects the request, for example another tab took the name. Nothing was written. */
	| { status: 'invalid'; saved: SavedNotebook; message: string }
	/** Setup is not confirmed yet, so Sections are added in Setup. */
	| { status: 'unconfirmed' }
	| { status: 'missing' };

function sameOutcome(a: PlacementOutcome, b: PlacementOutcome) {
	if (a.kind === 'placed' && b.kind === 'placed') {
		const [x, y] = [a.section, b.section];
		return (
			x.first === y.first &&
			x.last === y.last &&
			x.titlePage === y.titlePage &&
			x.colour === y.colour
		);
	}
	if (a.kind === 'pending' && b.kind === 'pending') {
		return a.pending.reason === b.pending.reason && a.pending.colour === b.pending.colour;
	}
	return false;
}

/**
 * Adds a Section to the Notebook as it is stored right now, never to a copy held in memory, so
 * changes made in another tab are kept. `shown` is the outcome the person saw in the preview: when
 * the stored Notebook would now give a different one, nothing is written, so adding always places
 * the Section exactly where the preview said.
 */
export async function saveAddSection(
	store: NotebookStore,
	id: string,
	request: SectionRequest,
	shown: PlacementOutcome
): Promise<AddSectionSave> {
	const fresh = await store.get(id);
	if (!fresh) return { status: 'missing' };
	if (!fresh.setupConfirmed) return { status: 'unconfirmed' };
	let result: { notebook: Notebook; outcome: PlacementOutcome };
	try {
		result = addSection(fresh.notebook, request);
	} catch (error) {
		if (error instanceof RangeError) {
			return { status: 'invalid', saved: fresh, message: error.message };
		}
		throw error;
	}
	if (!sameOutcome(result.outcome, shown)) return { status: 'changed', saved: fresh };
	const saved = { ...fresh, notebook: result.notebook };
	await store.save(saved);
	return { status: 'saved', saved, outcome: result.outcome };
}
