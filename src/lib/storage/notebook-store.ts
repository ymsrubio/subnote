import type { SavedNotebook } from './saved-notebook';

/**
 * Where Notebooks are kept. Milestone 1 keeps them on this device; milestone 2's sync replaces the
 * implementation without touching a caller. Async so a remote store fits the same shape.
 */
export interface NotebookStore {
	/** Every saved Notebook, oldest first. */
	list(): Promise<SavedNotebook[]>;
	get(id: string): Promise<SavedNotebook | undefined>;
	/** Adds the Notebook, or replaces the one with the same id. */
	save(notebook: SavedNotebook): Promise<void>;
}
