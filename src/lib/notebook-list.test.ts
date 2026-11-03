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
	it('lists the Pending Sections of a confirmed Notebook with where they came from', () => {
		expect(waitingSections([spring]).map((w) => [w.section.name, w.from])).toEqual([
			['Reading log', 'Spring']
		]);
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
		expect(waitingSections([draft])).toEqual([]);
	});

	it('drops a Section a later Notebook has carried on, placed or still pending', () => {
		const first = saved('First', 8, [
			{ name: 'A', pages: 8 },
			{ name: 'B', pages: 4 },
			{ name: 'C', pages: 4 }
		]);
		const second = saved('Second', 4, [
			{ name: 'b', pages: 4 },
			{ name: 'D', pages: 4 }
		]);
		expect(waitingSections([first, second]).map((w) => [w.section.name, w.from])).toEqual([
			['C', 'First'],
			['D', 'Second']
		]);
	});
});
