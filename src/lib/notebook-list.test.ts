import { describe, expect, it } from 'vitest';
import { notebookSummary, pageStrip, waitingSections } from './notebook-list';
import { removeSection, setupNotebook } from './placement';
import type { SavedNotebook } from './storage';

const saved = (
	id: string,
	pageCount: number,
	requests: { name: string; pages: number }[],
	setupConfirmed = true
): SavedNotebook => ({
	id,
	name: id,
	setupConfirmed,
	notebook: setupNotebook(pageCount, requests)
});

const spring = saved('Spring', 120, [
	{ name: 'Journal', pages: 64 },
	{ name: 'Habit tracker', pages: 20 },
	{ name: 'Idea capture', pages: 10 },
	{ name: 'Calendar', pages: 4 },
	{ name: 'Reading log', pages: 12 }
]);

const runs = (s: SavedNotebook) => pageStrip(s).map((r) => [r.colour, r.pages]);

describe('pageStrip', () => {
	it('colours the canvas Spring notebook run by run, Free Pages at the end', () => {
		expect(runs(spring)).toEqual([
			['sage', 64],
			['clay', 32],
			['ochre', 16],
			['slate', 4],
			[null, 4]
		]);
	});

	it('shows Free Pages between Sections after one is removed', () => {
		const notebook = removeSection(spring.notebook, 'Idea capture');
		expect(runs({ ...spring, notebook })).toEqual([
			['sage', 64],
			['clay', 32],
			[null, 16],
			['slate', 4],
			[null, 4]
		]);
	});

	it('orders runs by page even when Sections are given out of order', () => {
		const shuffled = {
			...spring,
			notebook: {
				...spring.notebook,
				sections: [...spring.notebook.sections].reverse()
			}
		};
		expect(runs(shuffled)).toEqual(runs(spring));
	});

	it('is all Free Pages for an empty Setup', () => {
		expect(runs(saved('Empty', 96, []))).toEqual([[null, 96]]);
	});
});

describe('notebookSummary', () => {
	it('counts pages, Sections and Free Pages', () => {
		expect(notebookSummary(spring)).toBe('120 pages · 4 Sections · 4 Free Pages');
	});

	it('leaves Free Pages out when there are none', () => {
		const full = saved('Winter', 96, [
			{ name: 'Journal', pages: 64 },
			{ name: 'Habit tracker', pages: 16 },
			{ name: 'Idea capture', pages: 8 },
			{ name: 'Calendar', pages: 8 }
		]);
		expect(notebookSummary(full)).toBe('96 pages · 4 Sections');
	});

	it('uses singular words for one', () => {
		expect(notebookSummary(saved('Tiny', 1, [{ name: 'Only', pages: 1 }]))).toBe(
			'1 page · 1 Section'
		);
		expect(notebookSummary(saved('Two', 2, [{ name: 'Only', pages: 1 }]))).toBe(
			'2 pages · 1 Section · 1 Free Page'
		);
	});
});

describe('waitingSections', () => {
	const waits = (notebooks: SavedNotebook[]) => {
		const waiting = waitingSections(notebooks);
		return waiting && [waiting.from, waiting.sections.map((s) => s.name)];
	};
	const winter = saved('Winter', 8, [
		{ name: 'A', pages: 8 },
		{ name: 'B', pages: 4 },
		{ name: 'C', pages: 4 }
	]);

	it('is null before any Notebook is confirmed', () => {
		expect(waitingSections([])).toBeNull();
		expect(waits([saved('Draft', 8, [{ name: 'A', pages: 8 }], false)])).toBeNull();
	});

	it('lists the Pending Sections of a confirmed Notebook with where they came from', () => {
		expect(waits([spring])).toEqual(['Spring', ['Reading log']]);
	});

	it('ignores Pending Sections of an unconfirmed Setup', () => {
		const draft = saved(
			'Draft',
			8,
			[
				{ name: 'A', pages: 8 },
				{ name: 'B', pages: 4 }
			],
			false
		);
		expect(waits([draft])).toBeNull();
	});

	it('waits for nothing from an older Notebook when the newer one dropped its Pending Section', () => {
		const summer = saved('Summer', 8, [{ name: 'D', pages: 8 }]);
		expect(waits([winter, summer])).toEqual(['Summer', []]);
	});

	it('is not cleared by an unrelated Section with the same name in a later Notebook', () => {
		const spring2 = saved('Spring', 8, [
			{ name: 'b', pages: 4 },
			{ name: 'x', pages: 4 }
		]);
		expect(waits([winter, spring2])).toEqual(['Spring', []]);
	});

	it('keeps the newest confirmed Notebook waiting past a newer unconfirmed one', () => {
		const draft = saved('Draft', 4, [{ name: 'Z', pages: 4 }], false);
		expect(waits([winter, draft])).toEqual(['Winter', ['B', 'C']]);
	});

	it('lists a newer confirmed Notebook with its own Pending Sections instead of the older ones', () => {
		const summer = saved('Summer', 8, [
			{ name: 'D', pages: 8 },
			{ name: 'E', pages: 4 }
		]);
		expect(waits([winter, summer])).toEqual(['Summer', ['E']]);
	});

	it('finds Pending Sections in a later Notebook when the earlier one has none', () => {
		const full = saved('Winter', 8, [{ name: 'A', pages: 8 }]);
		const summer = saved('Summer', 8, [
			{ name: 'D', pages: 8 },
			{ name: 'E', pages: 4 }
		]);
		expect(waits([full, summer])).toEqual(['Summer', ['E']]);
	});

	it('reports Pending Section names trimmed', () => {
		const padded = saved('Padded', 8, [
			{ name: 'A', pages: 8 },
			{ name: '  B  ', pages: 4 }
		]);
		expect(waits([padded])).toEqual(['Padded', ['B']]);
	});
});
