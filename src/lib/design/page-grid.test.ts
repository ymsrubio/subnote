import { describe, expect, it } from 'vitest';
import { freePages, gridLabel, gridRows, type GridSection } from './page-grid';

const sections: GridSection[] = [
	{ name: 'Journal', colour: 'sage', first: 1, last: 20 },
	{ name: 'Budget', colour: 'ochre', first: 21, last: 24 },
	{ name: 'Garden', colour: 'teal', first: 25, last: 28 }
];

describe('gridRows', () => {
	const rows = gridRows(40, sections);

	it('lays 16 squares a row and pads the last row with empty squares', () => {
		expect(rows.map((row) => row.cells.length)).toEqual([16, 16, 16]);
		expect(rows[2].cells.filter((c) => c.kind === 'empty')).toHaveLength(8);
	});

	it('numbers each row by its first page', () => {
		expect(rows.map((row) => row.first)).toEqual([1, 17, 33]);
	});

	it('marks the Title Page, the rest of the Section and the Free Pages', () => {
		expect(rows[0].cells[0]).toEqual({ kind: 'title', page: 1, colour: 'sage' });
		expect(rows[0].cells[1]).toEqual({ kind: 'section', page: 2, colour: 'sage' });
		expect(rows[2].cells[0]).toEqual({ kind: 'free', page: 33 });
	});

	it('puts both names on a row holding two Title Pages', () => {
		expect(rows[1].titles.map((s) => s.name)).toEqual(['Budget', 'Garden']);
		expect(rows[2].titles).toEqual([]);
	});
});

describe('gridLabel', () => {
	it('says which pages belong to which Section and how many are free', () => {
		expect(gridLabel('Spring notebook', 40, sections)).toBe(
			'Spring notebook, 40 pages. Journal pages 1–20, Budget pages 21–24, Garden pages 25–28. 12 Free Pages.'
		);
	});

	it('counts Free Pages', () => {
		expect(freePages(40, sections)).toBe(12);
	});
});
