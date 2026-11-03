import { describe, expect, it } from 'vitest';
import { addSection, previewAddSection, setupNotebook } from '../placement';
import { freeSummary, noticeOf, previewOf, rowsInPageOrder, summaryLine } from './notebook-text';

describe('summaryLine', () => {
	it('counts pages, Sections and Free Pages', () => {
		expect(summaryLine(spring())).toBe('120 pages · 4 Sections · 4 Free Pages');
	});

	it('says "no Free Pages" when full', () => {
		const full = addSection(spring(), { name: 'Travel', pages: 3 }).notebook;
		expect(summaryLine(full)).toBe('120 pages · 5 Sections · no Free Pages');
	});
});

const spring = () =>
	setupNotebook(120, [
		{ name: 'Journal', pages: 64 },
		{ name: 'Habit tracker', pages: 20 },
		{ name: 'Idea capture', pages: 10 },
		{ name: 'Calendar', pages: 4 },
		{ name: 'Reading log', pages: 12 }
	]);

describe('previewOf', () => {
	it('gives the range and the Title Page when it fits', () => {
		const preview = previewOf(previewAddSection(spring(), { name: 'Travel', pages: 3 }), 'Spring');
		expect(preview).toEqual({
			kind: 'fits',
			name: 'Travel',
			colour: 'teal',
			range: 'pages 117–120',
			instruction: 'Write its name on page 117, its Title Page.'
		});
	});

	it('gives the reason when it does not fit', () => {
		const preview = previewOf(previewAddSection(spring(), { name: 'Recipes', pages: 6 }), 'Spring');
		expect(preview).toMatchObject({
			kind: 'pending',
			name: 'Recipes',
			title: 'No room in Spring.',
			detail:
				"Recipes needs 8 pages in one aligned block, and only 4 Free Pages are left. It'll become a Pending Section and wait for your next Notebook."
		});
	});

	it('says "page" for a one-page Section', () => {
		const notebook = setupNotebook(4, [{ name: 'A', pages: 2 }]);
		const preview = previewOf(previewAddSection(notebook, { name: 'B', pages: 1 }), 'Mini');
		expect(preview).toMatchObject({
			range: 'page 3',
			instruction: 'Write its name on page 3, its Title Page.'
		});
	});
});

describe('noticeOf', () => {
	it('repeats the outcome in the past tense for a Pending Section', () => {
		const { outcome } = addSection(spring(), { name: 'Recipes', pages: 6 });
		expect(noticeOf(outcome)).toMatchObject({
			name: 'Recipes',
			text: "didn't fit: it needs 8 pages in one aligned block, and only 4 Free Pages were left. It'll wait for your next Notebook."
		});
	});

	it('uses "was" for a single Free Page', () => {
		const notebook = setupNotebook(8, [
			{ name: 'A', pages: 4 },
			{ name: 'B', pages: 2 },
			{ name: 'C', pages: 1 }
		]);
		const { outcome } = addSection(notebook, { name: 'D', pages: 2 });
		expect(noticeOf(outcome)?.text).toBe(
			"didn't fit: it needs 2 pages in one aligned block, and only 1 Free Page was left. It'll wait for your next Notebook."
		);
	});

	it('is null when the Section was placed', () => {
		expect(noticeOf(addSection(spring(), { name: 'Travel', pages: 3 }).outcome)).toBeNull();
	});
});

describe('freeSummary', () => {
	it('lists the Free Pages and where they are', () => {
		expect(freeSummary(spring())).toBe('4 Free Pages left, 117–120');
	});

	it('says so when none are left', () => {
		const full = addSection(spring(), { name: 'Travel', pages: 3 }).notebook;
		expect(freeSummary(full)).toBe('No Free Pages left');
	});

	it('lists every run', () => {
		const notebook = setupNotebook(16, [
			{ name: 'A', pages: 4 },
			{ name: 'B', pages: 4 }
		]);
		expect(freeSummary(notebook)).toBe('8 Free Pages left, 9–16');
	});
});

describe('rowsInPageOrder', () => {
	it('puts Sections and Free Pages in page order', () => {
		const rows = rowsInPageOrder(spring()).map((r) =>
			r.kind === 'free' ? `free ${r.first}-${r.last}` : `${r.name} ${r.first}-${r.last}`
		);
		expect(rows).toEqual([
			'Journal 1-64',
			'Habit tracker 65-96',
			'Idea capture 97-112',
			'Calendar 113-116',
			'free 117-120'
		]);
	});
});
