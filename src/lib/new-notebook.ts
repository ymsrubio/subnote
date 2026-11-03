import { maxPageCount } from './storage/saved-notebook';

export interface NewNotebookInput {
	name: string;
	/** What the person typed. */
	pages: string;
}

export type NewNotebookResult =
	| { ok: true; name: string; pageCount: number }
	| { ok: false; errors: { name?: string; pages?: string } };

/** Checks the New Notebook form. Each error is the text to show under its field. */
export function validateNewNotebook(input: NewNotebookInput): NewNotebookResult {
	const name = input.name.trim();
	const typed = input.pages.trim();
	const errors: { name?: string; pages?: string } = {};
	if (name === '') errors.name = 'Give the Notebook a name';
	const pageCount = Number(typed);
	if (typed === '') errors.pages = 'Enter how many pages it has';
	else if (!Number.isInteger(pageCount)) errors.pages = 'Pages must be a whole number';
	else if (pageCount < 1) errors.pages = 'A Notebook needs at least 1 page';
	else if (pageCount > maxPageCount) errors.pages = `Subnote handles up to ${maxPageCount} pages`;
	if (errors.name || errors.pages) return { ok: false, errors };
	return { ok: true, name, pageCount };
}
