import { removeSection, type Notebook, type PlacedSection, type SectionColour } from '../placement';
import type { NotebookStore, SavedNotebook } from '../storage';

/** The Section the person confirmed removing: its name and the pages the Dialog named. */
export type RemovalShown = Pick<PlacedSection, 'name' | 'first' | 'last'>;

/** A neighbour that took a new colour because removing the Section left two alike side by side. */
export interface Recolour {
	name: string;
	from: SectionColour;
	to: SectionColour;
}

export type RemoveSectionSave =
	| { status: 'saved'; saved: SavedNotebook; removed: PlacedSection; recoloured: Recolour[] }
	/** Another tab already removed it. Nothing was written. */
	| { status: 'gone'; saved: SavedNotebook }
	/** The stored Section no longer covers the pages the Dialog named. Nothing was written. */
	| { status: 'changed'; saved: SavedNotebook }
	/** Setup is not confirmed yet, so Sections are removed in Setup. */
	| { status: 'unconfirmed' }
	| { status: 'missing' };

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function recolouredBy(before: Notebook, after: Notebook): Recolour[] {
	return after.sections.flatMap((s) => {
		const old = before.sections.find((o) => o.name === s.name);
		return old && old.colour !== s.colour ? [{ name: s.name, from: old.colour, to: s.colour }] : [];
	});
}

/**
 * Removes a Section from the Notebook as it is stored right now, never from a copy held in memory,
 * so changes made in another tab are kept. `shown` is the Section the Dialog named: when the stored
 * Notebook has no such Section, or it now covers other pages, nothing is written.
 */
export async function saveRemoveSection(
	store: NotebookStore,
	id: string,
	shown: RemovalShown
): Promise<RemoveSectionSave> {
	const fresh = await store.get(id);
	if (!fresh) return { status: 'missing' };
	if (!fresh.setupConfirmed) return { status: 'unconfirmed' };
	const removed = fresh.notebook.sections.find((s) => sameName(s.name, shown.name));
	if (!removed) return { status: 'gone', saved: fresh };
	if (removed.first !== shown.first || removed.last !== shown.last) {
		return { status: 'changed', saved: fresh };
	}
	const notebook = removeSection(fresh.notebook, removed.name);
	const saved = { ...fresh, notebook };
	await store.save(saved);
	return { status: 'saved', saved, removed, recoloured: recolouredBy(fresh.notebook, notebook) };
}
