import type { NotebookStore } from './notebook-store';
import { parseSavedNotebook, type SavedNotebook } from './saved-notebook';

export const storageKey = 'subnote:notebooks:v1';

/** Reads the stored list, keeping the entries that parse and dropping the rest. */
function read(storage: Pick<Storage, 'getItem'>): SavedNotebook[] {
	const raw = storage.getItem(storageKey);
	if (raw === null) return [];
	let data: unknown;
	try {
		data = JSON.parse(raw);
	} catch {
		return [];
	}
	if (!Array.isArray(data)) return [];
	return data.flatMap((entry) => {
		const parsed = parseSavedNotebook(entry);
		return parsed.ok ? [parsed.value] : [];
	});
}

/** Keeps Notebooks in a Web Storage object. `getStorage` runs on each call, so importing this on the server is safe. */
export function createLocalNotebookStore(
	getStorage: () => Pick<Storage, 'getItem' | 'setItem'>
): NotebookStore {
	return {
		async list() {
			return read(getStorage());
		},
		async get(id) {
			return read(getStorage()).find((saved) => saved.id === id);
		},
		async save(notebook) {
			const storage = getStorage();
			const all = read(storage);
			const index = all.findIndex((saved) => saved.id === notebook.id);
			if (index === -1) all.push(notebook);
			else all[index] = notebook;
			storage.setItem(storageKey, JSON.stringify(all));
		}
	};
}
