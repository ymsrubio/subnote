import type { Notebook } from '../placement';
import type { NotebookStore, SavedNotebook } from '../storage';

export type SetupSave =
	| { status: 'saved'; saved: SavedNotebook }
	/** Setup was already confirmed, here or in another tab. Nothing was written. */
	| { status: 'locked' }
	| { status: 'missing' };

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
	const saved = { ...fresh, notebook: edit(fresh.notebook) };
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
