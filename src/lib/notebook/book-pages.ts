import type { FlipBookPage } from '../components/flip-book.svelte';
import { spreadOfPage } from '../flip-book/turn';
import type { Notebook, PlacedSection } from '../placement';

/**
 * Every Page of the Notebook in page order, so page 1 is the first item. A Section's Pages carry its
 * colour, its Title Page also carries its name and page range, and a Free Page is empty.
 * Pending Sections hold no Pages, so they add nothing.
 */
export function bookPages(notebook: Notebook): FlipBookPage[] {
	const pages: FlipBookPage[] = Array.from({ length: notebook.pageCount }, () => ({}));
	for (const placed of notebook.sections) {
		const section = { colour: placed.colour, name: placed.name };
		for (let number = placed.first; number <= placed.last; number++) {
			pages[number - 1] = { section };
		}
		pages[placed.first - 1] = {
			section,
			title: true,
			range: `pp. ${placed.first}–${placed.last}`
		};
	}
	return pages;
}

/** The spread that opens on the Section's Title Page. */
export function spreadOfSection(section: Pick<PlacedSection, 'first'>): number {
	return spreadOfPage(section.first);
}
