import type { SectionColour } from './sections';

/** A placed Section: its pages run `first` to `last`, and `first` is its Title Page. */
export interface GridSection {
	name: string;
	colour: SectionColour;
	first: number;
	last: number;
}

export const pagesPerRow = 16;

export type GridCell =
	| { kind: 'section'; page: number; colour: SectionColour }
	| { kind: 'title'; page: number; colour: SectionColour }
	| { kind: 'free'; page: number }
	| { kind: 'empty' };

export interface GridRow {
	/** The first page in the row, shown as its number. */
	first: number;
	cells: GridCell[];
	/** Sections whose Title Page is in this row. */
	titles: GridSection[];
}

export function freePages(pageCount: number, sections: GridSection[]) {
	return pageCount - sections.reduce((sum, s) => sum + (s.last - s.first + 1), 0);
}

export function gridRows(pageCount: number, sections: GridSection[]): GridRow[] {
	const cellFor = (page: number): GridCell => {
		if (page > pageCount) return { kind: 'empty' };
		const section = sections.find((s) => page >= s.first && page <= s.last);
		if (!section) return { kind: 'free', page };
		return { kind: page === section.first ? 'title' : 'section', page, colour: section.colour };
	};
	return Array.from({ length: Math.ceil(pageCount / pagesPerRow) }, (_, row) => {
		const first = row * pagesPerRow + 1;
		const last = first + pagesPerRow - 1;
		return {
			first,
			cells: Array.from({ length: pagesPerRow }, (_, i) => cellFor(first + i)),
			titles: sections.filter((s) => s.first >= first && s.first <= last)
		};
	});
}

/** What the squares show, in words: "Spring notebook, 120 pages. Journal pages 1–64. 24 Free Pages." */
export function gridLabel(name: string, pageCount: number, sections: GridSection[]) {
	const parts = sections.map((s) => `${s.name} pages ${s.first}–${s.last}`);
	const free = freePages(pageCount, sections);
	return `${name}, ${pageCount} pages. ${parts.join(', ')}${parts.length ? '. ' : ''}${free} Free ${free === 1 ? 'Page' : 'Pages'}.`;
}
