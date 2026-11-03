import type { SectionColour } from './design/sections';
import { freePages, type PendingSection } from './placement';
import type { SavedNotebook } from './storage';

/** A run of pages in a Notebook's page strip: one Section, or a stretch of Free Pages (`colour` null). */
export interface StripRun {
	colour: SectionColour | null;
	pages: number;
}

/** Every page of the Notebook in page order, grouped by Section. Free Pages between Sections are their own runs. */
export function pageStrip(saved: SavedNotebook): StripRun[] {
	const { pageCount, sections } = saved.notebook;
	const runs: StripRun[] = [];
	let next = 1;
	for (const section of [...sections].sort((a, b) => a.first - b.first)) {
		if (section.first > next) runs.push({ colour: null, pages: section.first - next });
		runs.push({ colour: section.colour, pages: section.last - section.first + 1 });
		next = section.last + 1;
	}
	if (next <= pageCount) runs.push({ colour: null, pages: pageCount - next + 1 });
	return runs;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** "120 pages · 5 Sections · 16 Free Pages". Free Pages are left out when there are none. */
export function notebookSummary(saved: SavedNotebook): string {
	const { notebook } = saved;
	const free = freePages(notebook);
	return [
		plural(notebook.pageCount, 'page', 'pages'),
		plural(notebook.sections.length, 'Section', 'Sections'),
		...(free > 0 ? [plural(free, 'Free Page', 'Free Pages')] : [])
	].join(' · ');
}

/** The Pending Sections waiting for the next Notebook, and the Notebook they didn't fit in. */
export interface WaitingSections {
	from: string;
	sections: PendingSection[];
}

/**
 * The Pending Sections waiting for the next Notebook: those of the newest confirmed Notebook, or `null`
 * when no Notebook is confirmed. `notebooks` are oldest first, as `NotebookStore.list()` returns them, so
 * the newest is the last. Older confirmed Notebooks' Pending Sections were handed to the next Setup, which
 * carried or dropped them, so they never wait again. A newer Notebook whose Setup is not confirmed yet
 * changes nothing.
 */
export function waitingSections(notebooks: SavedNotebook[]): WaitingSections | null {
	const newest = notebooks.findLast((saved) => saved.setupConfirmed);
	return newest ? { from: newest.name, sections: newest.notebook.pending } : null;
}
