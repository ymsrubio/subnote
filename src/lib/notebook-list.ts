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

/** A Pending Section and the Notebook it didn't fit in. */
export interface WaitingSection {
	section: PendingSection;
	from: string;
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * The Pending Sections still waiting for a Notebook, oldest first. `notebooks` are oldest first, as the
 * store lists them. Only a confirmed Setup has Pending Sections for good. A Section whose name appears in
 * a later Notebook has been carried on there, so it no longer waits here.
 */
export function waitingSections(notebooks: SavedNotebook[]): WaitingSection[] {
	return notebooks.flatMap((saved, index) => {
		if (!saved.setupConfirmed) return [];
		const later = notebooks.slice(index + 1);
		return saved.notebook.pending
			.filter(
				(section) =>
					!later.some((other) =>
						[...other.notebook.sections, ...other.notebook.pending].some((s) =>
							sameName(s.name, section.name)
						)
					)
			)
			.map((section) => ({ section, from: saved.name }));
	});
}
