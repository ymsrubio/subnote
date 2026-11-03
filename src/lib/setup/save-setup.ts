import type { Notebook } from '../placement';
import type { Carried, NotebookStore, SavedNotebook } from '../storage';

export type SetupSave =
	| { status: 'saved'; saved: SavedNotebook }
	/** Setup was already confirmed, here or in another tab. Nothing was written. */
	| { status: 'locked' }
	| { status: 'missing' };

/** Drops the markers of rows an edit removed, so a Section added by hand under the same name is not marked. */
function withoutRemoved(carried: Carried, notebook: Notebook): Carried {
	const names = new Set([...notebook.sections, ...notebook.pending].map((s) => s.name));
	return { ...carried, sections: carried.sections.filter((s) => names.has(s.name)) };
}

/**
 * Applies an edit to the Notebook as it is stored right now, never to a copy held in memory, so a
 * tab that confirmed Setup, or an edit made in another tab, is not undone. A confirmed Notebook is
 * left alone.
 */
export async function saveSetupEdit(
	store: NotebookStore,
	id: string,
	edit: (notebook: Notebook) => Notebook
): Promise<SetupSave> {
	const fresh = await store.get(id);
	if (!fresh) return { status: 'missing' };
	if (fresh.setupConfirmed) return { status: 'locked' };
	const notebook = edit(fresh.notebook);
	const saved: SavedNotebook = { ...fresh, notebook };
	if (fresh.carried) saved.carried = withoutRemoved(fresh.carried, notebook);
	await store.save(saved);
	return { status: 'saved', saved };
}

/** Confirms Setup on the stored Notebook, keeping the placements as stored. */
export async function confirmStoredSetup(store: NotebookStore, id: string): Promise<SetupSave> {
	const fresh = await store.get(id);
	if (!fresh) return { status: 'missing' };
	if (fresh.setupConfirmed) return { status: 'locked' };
	const saved = { ...fresh, setupConfirmed: true };
	await store.save(saved);
	return { status: 'saved', saved };
}
