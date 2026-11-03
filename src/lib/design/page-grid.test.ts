import { describe, expect, it } from 'vitest';
import { planGrid, type GridSection } from './page-grid';

const spring: GridSection[] = [
	{ name: 'Journal', colour: 'sage', first: 1, size: 64 },
	{ name: 'Budget', colour: 'ochre', first: 65, size: 8 },
	{ name: 'Garden', colour: 'teal', first: 73, size: 8 },
	{ name: 'Projects', colour: 'slate', first: 81, size: 24 }
];

const kinds = (cells: { kind: string }[]) => cells.map((c) => c.kind);

describe('the 120-page Spring plan', () => {
	const plan = planGrid('Spring notebook', 120, spring);

	it('is labelled with each Section and its pages', () => {
		expect(plan.label).toBe(
			'Spring notebook, 120 pages. Journal pages 1–64. Budget pages 65–72. Garden pages 73–80. Projects pages 81–104. 16 Free Pages.'
		);
	});

	it('lays 8 rows of 16 starting at 1, 17 … 113', () => {
		expect(plan.rows.map((row) => row.first)).toEqual([1, 17, 33, 49, 65, 81, 97, 113]);
		expect(plan.free).toBe(16);
	});

	it('fills row 5 with two Title Pages and their Sections', () => {
		const row = plan.rows[4];
		expect(row.titles.map((s) => s.name)).toEqual(['Budget', 'Garden']);
		expect(kinds(row.cells)).toEqual([
			'title',
			...Array(7).fill('section'),
			'title',
			...Array(7).fill('section')
		]);
	});

	it('leaves the last row half empty after its free pages', () => {
		expect(kinds(plan.rows[7].cells)).toEqual([
			...Array(8).fill('free'),
			...Array(8).fill('empty')
		]);
	});
});

describe('planGrid', () => {
	it('says "1 Free Page" in the singular', () => {
		const plan = planGrid('Tiny', 16, [{ name: 'Journal', colour: 'sage', first: 1, size: 15 }]);
		expect(plan.free).toBe(1);
		expect(plan.label).toBe('Tiny, 16 pages. Journal pages 1–15. 1 Free Page.');
	});

	it('labels a Section of one page as "page 5"', () => {
		const plan = planGrid('Tiny', 16, [{ name: 'Note', colour: 'clay', first: 5, size: 1 }]);
		expect(plan.label).toBe('Tiny, 16 pages. Note page 5. 15 Free Pages.');
	});

	it('shows only Free Pages and no names for a grid with no Sections', () => {
		const plan = planGrid('Empty', 20, []);
		expect(plan.label).toBe('Empty, 20 pages. 20 Free Pages.');
		expect(plan.free).toBe(20);
		expect(plan.rows.flatMap((row) => row.titles)).toEqual([]);
		expect(kinds(plan.rows[1].cells)).toEqual([
			...Array(4).fill('free'),
			...Array(12).fill('empty')
		]);
	});

	it('carries a Section across a row boundary and names it on its first row only', () => {
		const plan = planGrid('Cross', 48, [{ name: 'Long', colour: 'plum', first: 10, size: 14 }]);
		expect(plan.rows.map((row) => row.titles.map((s) => s.name))).toEqual([['Long'], [], []]);
		expect(kinds(plan.rows[0].cells).slice(8)).toEqual([
			'free',
			'title',
			...Array(6).fill('section')
		]);
		expect(kinds(plan.rows[1].cells).slice(0, 8)).toEqual([...Array(7).fill('section'), 'free']);
		expect(plan.free).toBe(34);
	});

	it('puts a Title Page at the end of a row in that row', () => {
		const plan = planGrid('Edge', 32, [{ name: 'End', colour: 'teal', first: 16, size: 3 }]);
		expect(plan.rows[0].titles.map((s) => s.name)).toEqual(['End']);
		expect(plan.rows[0].cells[15]).toEqual({ kind: 'title', page: 16, colour: 'teal' });
		expect(plan.rows[1].cells[0]).toEqual({ kind: 'section', page: 17, colour: 'teal' });
	});

	it.each([
		['an empty Section', { first: 1, size: 0 }, 'Bad needs a whole first page and at least 1 page'],
		[
			'a fractional size',
			{ first: 1, size: 2.5 },
			'Bad needs a whole first page and at least 1 page'
		],
		['a Section starting before page 1', { first: 0, size: 3 }, 'Bad runs outside pages 1–20'],
		['a Section past the last page', { first: 19, size: 3 }, 'Bad runs outside pages 1–20']
	])('rejects %s', (_, place, message) => {
		expect(() => planGrid('Spring', 20, [{ name: 'Bad', colour: 'sage', ...place }])).toThrow(
			new RangeError(message)
		);
	});

	it('rejects Sections that share pages', () => {
		expect(() =>
			planGrid('Spring', 20, [
				{ name: 'B', colour: 'clay', first: 5, size: 4 },
				{ name: 'A', colour: 'sage', first: 1, size: 5 }
			])
		).toThrow(new RangeError('A and B share pages'));
	});
});
