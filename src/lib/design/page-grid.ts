import type { SectionColour } from './sections';

/** A placed Section: `size` pages from `first`, `first` being its Title Page. */
export interface GridSection {
	name: string;
	colour: SectionColour;
	first: number;
	size: number;
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

export interface GridPlan {
	rows: GridRow[];
	/** Counted from the squares, so the text beside the grid can't disagree with them. */
	free: number;
	/** What the squares show, in words. */
	label: string;
}

const last = (section: GridSection) => section.first + section.size - 1;

function assertPlaced(pageCount: number, sections: GridSection[]) {
	const sorted = [...sections].sort((a, b) => a.first - b.first);
	sorted.forEach((section, index) => {
		if (!Number.isInteger(section.first) || !Number.isInteger(section.size) || section.size < 1) {
			throw new RangeError(`${section.name} needs a whole first page and at least 1 page`);
		}
		if (section.first < 1 || last(section) > pageCount) {
			throw new RangeError(`${section.name} runs outside pages 1–${pageCount}`);
		}
		const previous = sorted[index - 1];
		if (previous && last(previous) >= section.first) {
			throw new RangeError(`${previous.name} and ${section.name} share pages`);
		}
	});
}

function pageRange(section: GridSection) {
	return section.size === 1 ? `page ${section.first}` : `pages ${section.first}–${last(section)}`;
}

/** Throws a RangeError when a Section is empty, overlaps another, or runs past `pageCount`. */
export function planGrid(name: string, pageCount: number, sections: GridSection[]): GridPlan {
	assertPlaced(pageCount, sections);
	const cellFor = (page: number): GridCell => {
		if (page > pageCount) return { kind: 'empty' };
		const section = sections.find((s) => page >= s.first && page <= last(s));
		if (!section) return { kind: 'free', page };
		return { kind: page === section.first ? 'title' : 'section', page, colour: section.colour };
	};
	const rows = Array.from({ length: Math.ceil(pageCount / pagesPerRow) }, (_, row) => {
		const first = row * pagesPerRow + 1;
		return {
			first,
			cells: Array.from({ length: pagesPerRow }, (_, i) => cellFor(first + i)),
			titles: sections.filter((s) => s.first >= first && s.first < first + pagesPerRow)
		};
	});
	const free = rows.flatMap((row) => row.cells).filter((cell) => cell.kind === 'free').length;
	const described = sections.map((s) => `${s.name} ${pageRange(s)}`);
	const freeText = `${free} Free ${free === 1 ? 'Page' : 'Pages'}`;
	return {
		rows,
		free,
		label: `${name}, ${pageCount} pages. ${[...described, freeText].join('. ')}.`
	};
}
