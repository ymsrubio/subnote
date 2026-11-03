import type { NotebookStore } from './notebook-store';
import { parseSavedNotebook, type SavedNotebook } from './saved-notebook';

export const storageKey = 'subnote:notebooks:v1';

interface Stored {
	notebooks: SavedNotebook[];
	/** Entries this version cannot read. They stay in storage on every save. */
	unreadable: unknown[];
	/** Set when the stored text is not a list at all, so a save would overwrite it. */
	corrupt?: string;
}

function read(storage: Pick<Storage, 'getItem'>): Stored {
	const raw = storage.getItem(storageKey);
	if (raw === null) return { notebooks: [], unreadable: [] };
	let data: unknown;
	try {
		data = JSON.parse(raw);
	} catch {
		return { notebooks: [], unreadable: [], corrupt: raw };
	}
	if (!Array.isArray(data)) return { notebooks: [], unreadable: [], corrupt: raw };
	const stored: Stored = { notebooks: [], unreadable: [] };
	for (const entry of data) {
		const parsed = parseSavedNotebook(entry);
		if (parsed.ok) stored.notebooks.push(parsed.value);
		else stored.unreadable.push(entry);
	}
	return stored;
}

/** Keeps Notebooks in a Web Storage object. `getStorage` runs on each call, so importing this on the server is safe. */
export function createLocalNotebookStore(
	getStorage: () => Pick<Storage, 'getItem' | 'setItem'>
): NotebookStore {
	return {
		async list() {
			return read(getStorage()).notebooks;
		},
		async get(id) {
			return read(getStorage()).notebooks.find((saved) => saved.id === id);
		},
		async save(notebook) {
			const storage = getStorage();
			const { notebooks, unreadable, corrupt } = read(storage);
			if (corrupt !== undefined) storage.setItem(`${storageKey}:corrupt-${Date.now()}`, corrupt);
			const index = notebooks.findIndex((saved) => saved.id === notebook.id);
			if (index === -1) notebooks.push(notebook);
			else notebooks[index] = notebook;
			storage.setItem(storageKey, JSON.stringify([...notebooks, ...unreadable]));
		}
	};
}
