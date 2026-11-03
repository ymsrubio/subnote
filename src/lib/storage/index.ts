import { createLocalNotebookStore } from './local-notebook-store';

export type { NotebookStore } from './notebook-store';
export { newSavedNotebook, parseSavedNotebook } from './saved-notebook';
export type { SavedNotebook } from './saved-notebook';

/** The store the app uses. The one line to change when milestone 2 brings sync. */
export const notebookStore = createLocalNotebookStore(() => localStorage);
